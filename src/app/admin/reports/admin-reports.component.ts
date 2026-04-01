import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx-js-style';
import { AdminService } from '../services/admin.service';
import { AdminSurveySummary, ReportFilters, ReportResult } from '../../shared/models/admin.models';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_MODULES],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminReportsComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  surveys: AdminSurveySummary[] = [];
  report: ReportResult | null = null;
  loading = false;

  displayedAverageColumns = ['question_text', 'total_responses', 'average_score'];
  displayedBelowThresholdColumns = [
    'question_text',
    'total_responses',
    'responses_below_threshold',
    'percentage_below_threshold'
  ];
  displayedLowScoreCommentColumns = ['question_text', 'score_given', 'user_comment'];
  displayedRankingColumns = ['rank', 'question_text', 'average_score'];

  readonly filtersForm = this.formBuilder.group({
    survey_id: [0],
    startDate: [''],
    endDate: [''],
    questionText: ['']
  });

  get averageScoreSummary(): { totalQuestions: number; totalAverageScore: number } {
    const rows = this.report?.averageScorePerQuestion ?? [];
    const totalQuestions = rows.length;
    const totalAverageScore = Number(
      rows.reduce((sum, row) => sum + row.average_score, 0).toFixed(2)
    );

    return {
      totalQuestions,
      totalAverageScore
    };
  }

  ngOnInit(): void {
    // Load available surveys and initialize the report view.
    this.adminService.getSurveys().subscribe({
      next: (surveys) => {
        this.surveys = surveys;
        const firstSurvey = surveys[0];
        if (firstSurvey) {
          this.filtersForm.patchValue({ survey_id: firstSurvey.id });
          this.fetchReport();
        }
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  fetchReport(): void {
    // Request report data based on the current filters.
    const filters = this.buildFilters();
    if (!filters.survey_id) {
      this.snackBar.open('Select a survey to view reports.', 'Dismiss', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.changeDetectorRef.markForCheck();

    this.adminService.getReport(filters).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Unable to load report.', 'Dismiss', { duration: 3000 });
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  exportExcel(): void {
    // Export all report tables into a single-sheet XLSX workbook.
    if (!this.report) {
      return;
    }

    const averageScoreSummary = this.averageScoreSummary;
    const sections = [
      {
        title: 'Average Score per Question',
        headers: ['Question Text', 'Total Responses', 'Average Score'],
        rows: [
          ...this.report.averageScorePerQuestion.map((row) => [
            row.question_text,
            row.total_responses,
            row.average_score
          ]),
          [`Total Questions: ${averageScoreSummary.totalQuestions}`, '', `Total Average: ${averageScoreSummary.totalAverageScore}`]
        ]
      },
      {
        title: 'Percentage of Responses Below Threshold',
        headers: ['Question Text', 'Total Responses', 'Responses Below Threshold', 'Percentage Below Threshold'],
        rows: this.report.belowThresholdStats.map((row) => [
          row.question_text,
          row.total_responses,
          row.responses_below_threshold,
          row.percentage_below_threshold
        ])
      },
      {
        title: 'Low Score Comments',
        headers: ['Question Text', 'Score Given', 'User Comment'],
        rows: this.report.lowScoreComments.map((row) => [row.question_text, row.score_given, row.user_comment])
      },
      {
        title: 'Question Ranking',
        headers: ['Rank', 'Question Text', 'Average Score'],
        rows: this.report.questionRanking.map((row) => [row.rank, row.question_text, row.average_score])
      }
    ];
    const worksheetData: (string | number)[][] = [];
    const titleRows: number[] = [];
    const headerRows: number[] = [];
    const summaryRows: number[] = [];
    const merges: XLSX.Range[] = [];
    let maxColumns = 0;

    sections.forEach((section) => {
      const titleRowIndex = worksheetData.length + 1;
      titleRows.push(titleRowIndex);
      worksheetData.push([section.title]);

      const sectionColumnCount = Math.max(section.headers.length, ...section.rows.map((row) => row.length));
      maxColumns = Math.max(maxColumns, sectionColumnCount);
      merges.push({
        s: { r: titleRowIndex - 1, c: 0 },
        e: { r: titleRowIndex - 1, c: sectionColumnCount - 1 }
      });

      const headerRowIndex = worksheetData.length + 1;
      headerRows.push(headerRowIndex);
      worksheetData.push(section.headers);

      section.rows.forEach((row, rowIndex) => {
        const currentRowIndex = worksheetData.length + 1;
        worksheetData.push(row);

        if (section.title === 'Average Score per Question' && rowIndex === section.rows.length - 1) {
          summaryRows.push(currentRowIndex);
        }
      });

      worksheetData.push([]);
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!merges'] = merges;
    worksheet['!cols'] = this.buildExcelColumnWidths(maxColumns);

    this.applyExcelStyles(worksheet, titleRows, headerRows, summaryRows, maxColumns);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Report');
    XLSX.writeFile(workbook, 'survey-report.xlsx');
  }

  exportPdf(): void {
    // Generate a printable report that can be saved as PDF.
    if (!this.report) {
      return;
    }

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      return;
    }

    reportWindow.document.write(`
      <html>
        <head>
          <title>Survey Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 4px; }
            h3 { margin-top: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .summary-row td { background: #f3f4f6; font-weight: 700; border-top: 2px solid #d1d5db; }
            .page-break { break-before: page; page-break-before: always; }
          </style>
        </head>
        <body>
          <h2>${this.report.survey_title}</h2>

          <h3>Average Score per Question</h3>
          <table>
            <tr>
              <th>Question Text</th>
              <th>Total Responses</th>
              <th>Average Score</th>
            </tr>
            ${this.report.averageScorePerQuestion
              .map(
                (row) => `
                <tr>
                  <td>${row.question_text}</td>
                  <td>${row.total_responses}</td>
                  <td>${row.average_score}</td>
                </tr>
              `
              )
              .join('')}
            <tr class="summary-row">
              <td>Total Questions: ${this.averageScoreSummary.totalQuestions}</td>
              <td></td>
              <td>Total Average: ${this.averageScoreSummary.totalAverageScore}</td>
            </tr>
          </table>

          <h3 class="page-break">Percentage of Responses Below Threshold</h3>
          <table>
            <tr>
              <th>Question Text</th>
              <th>Total Responses</th>
              <th>Responses Below Threshold</th>
              <th>Percentage Below Threshold</th>
            </tr>
            ${this.report.belowThresholdStats
              .map(
                (row) => `
                <tr>
                  <td>${row.question_text}</td>
                  <td>${row.total_responses}</td>
                  <td>${row.responses_below_threshold}</td>
                  <td>${row.percentage_below_threshold}%</td>
                </tr>
              `
              )
              .join('')}
          </table>

          <h3 class="page-break">Low Score Comments</h3>
          <table>
            <tr>
              <th>Question Text</th>
              <th>Score Given</th>
              <th>User Comment</th>
            </tr>
            ${this.report.lowScoreComments
              .map(
                (row) => `
                <tr>
                  <td>${row.question_text}</td>
                  <td>${row.score_given}</td>
                  <td>${row.user_comment}</td>
                </tr>
              `
              )
              .join('')}
          </table>

          <h3 class="page-break">Question Ranking</h3>
          <table>
            <tr>
              <th>Rank</th>
              <th>Question Text</th>
              <th>Average Score</th>
            </tr>
            ${this.report.questionRanking
              .map(
                (row) => `
                <tr>
                  <td>${row.rank}</td>
                  <td>${row.question_text}</td>
                  <td>${row.average_score}</td>
                </tr>
              `
              )
              .join('')}
          </table>
        </body>
      </html>
    `);

    reportWindow.document.close();
    reportWindow.print();
  }

  private buildFilters(): ReportFilters {
    // Map form values into the report filter structure.
    const formValue = this.filtersForm.getRawValue();
    return {
      survey_id: Number(formValue.survey_id),
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined,
      questionText: formValue.questionText?.trim() || undefined
    };
  }

  private buildExcelColumnWidths(columnCount: number): XLSX.ColInfo[] {
    const defaultWidths = [42, 18, 18, 28];
    return Array.from({ length: columnCount }, (_, index) => ({
      wch: defaultWidths[index] ?? 18
    }));
  }

  private applyExcelStyles(
    worksheet: XLSX.WorkSheet,
    titleRows: number[],
    headerRows: number[],
    summaryRows: number[],
    columnCount: number
  ): void {
    titleRows.forEach((rowIndex) => {
      this.styleExcelRow(worksheet, rowIndex, columnCount, {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 13 },
        fill: { patternType: 'solid', fgColor: { rgb: '4B5563' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
    });

    headerRows.forEach((rowIndex) => {
      this.styleExcelRow(worksheet, rowIndex, columnCount, {
        font: { bold: true, color: { rgb: '111827' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'E5E7EB' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
    });

    summaryRows.forEach((rowIndex) => {
      this.styleExcelRow(worksheet, rowIndex, columnCount, {
        font: { bold: true, color: { rgb: '111827' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      });
    });
  }

  private styleExcelRow(
    worksheet: XLSX.WorkSheet,
    rowIndex: number,
    columnCount: number,
    style: Record<string, unknown>
  ): void {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: columnIndex });
      const cell = worksheet[cellAddress] as (XLSX.CellObject & { s?: Record<string, unknown> }) | undefined;

      if (!cell) {
        continue;
      }

      cell.s = {
        ...style,
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        }
      };
    }
  }

}
