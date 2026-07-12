# Code Cleanup & Refactoring Tasks

This document contains a checklist for cleaning up `provider.tsx` and the rest of the codebase to improve readability and maintainability.

## 1. Extract Types and Interfaces
- [ ] Create a `src/types/chat.ts` file.
- [ ] Move `AppContextType`, `MessageItems`, `UserProp`, and `AIBoxProps` from `provider.tsx` to `chat.ts`.
- [ ] Import these types into `provider.tsx` and other components where needed.

## 2. Refactor Network and Chat Logic (`useChatAPI.ts`)
- [ ] Create a custom hook named `useChatAPI.ts` in `src/hooks` or `src/services`.
- [ ] Move the `fetch` API call and `initWebsocket` connection logic out of `handleSend`.
- [ ] Expose a clean `sendMessage(message)` function from this hook.

## 3. Refactor Authentication Logic (`useAuth.ts`)
- [ ] Create a custom hook named `useAuth.ts`.
- [ ] Move `getAuthenticateRequest` and the `LocalAuthentication` logic out of `provider.tsx`.
- [ ] The provider should just use `const { authenticate } = useAuth();`.

## 4. Simplify State Management with `useReducer`
- [ ] `chatHistory` is currently managed using complex `.map()` logic spread across multiple `setChatHistory` calls.
- [ ] Convert `chatHistory` to use `useReducer`.
- [ ] Create actions like `ADD_USER_MESSAGE`, `UPDATE_MESSAGE_STATUS`, and `ADD_AI_MESSAGE`. This will encapsulate the logic in one place.

## 5. Fix Message Status State Updates
- [ ] Check how `msg.status` is applied in `provider.tsx`. Currently, the status updates (e.g. `status: "sent"` and `status: "error"`) are spread across multiple sequential state updates which can sometimes cause race conditions in React. 
- [ ] Ensure that when an error occurs, the user message status accurately reflects it without getting overwritten.
