# Employee Survey Portal

Frontend for the Employee Survey Portal (Angular 17+ standalone).

## Configure API Base URL

Update `src/environments/environment.ts` and set:

```
export const environment = {
  apiBaseUrl: 'http://localhost:8000',
  useMockAuth: true,
  useMockApi: true,
  idleTimeoutMinutes: 30
};
```

Set `useMockAuth` and `useMockApi` to `false` once the Laravel backend is ready.

## Install dependencies

```
npm install
```

## Run the app

```
ng serve
```

Then open `http://localhost:4200/`.

## Mock login (no backend yet)

- Any username/password works.
- If the username contains `admin`, you get the `ADMIN` role.
- If it contains `super`, you get the `SUPER_ADMIN` role.

## Mock data

- Surveys, users, and responses are stored in `sessionStorage` via `MockStoreService`.
- Admin pages allow editing surveys, unlocking users, and resetting completion using mock data.
- Reports and exports use mock data; Excel export is CSV-based.

## Routes

- `/login`
- `/surveys` (employee survey list)
- `/surveys/:id` (survey form)
- `/admin` (dashboard)
- `/admin/surveys` (survey management)
- `/admin/surveys/new`
- `/admin/surveys/:id`
- `/admin/users` (user management)
- `/admin/reports` (reporting & exports)
