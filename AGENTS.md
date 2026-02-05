## Project Summary
A gaming panel called FFGlory for managing groups and credits, featuring a sleek "Ultra Dark Gaming" aesthetic with neon red/pink accents.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database/Auth: Firebase (Auth & Realtime Database)
- Styling: Tailwind CSS
- Runtime: Bun

## Architecture
- `src/app`: Page routes and layouts.
- `src/components`: UI components (AuthScreen, Dashboard, UserView, AdminView).
- `src/hooks`: Custom hooks like `useUser`.
- `src/lib`: Utility functions and Firebase configuration.

## User Preferences
- Ultra dark gaming aesthetic.
- Functional components.
- No comments unless requested.

## Project Guidelines
- Use Firebase Auth for authentication.
- Data is stored in Firebase Realtime Database.
- Profiles are stored under `/profiles/{uid}`.
- Groups are stored under `/groups/{groupId}` with a `user_id` field.
- Transactions are stored under `/transactions/{uid}/{txId}`.
- Inbox messages are stored under `/inbox_messages/{uid}/{msgId}`.

## Common Patterns
- Auth state is managed by the `useUser` hook with Firebase listeners.
- Components use CSS variables defined in `globals.css` for consistent styling.
