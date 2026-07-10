# Middlewares Implementation Guide & TODO

This file contains the basic templates for the 5 essential middlewares we need to implement in the `backend/middlewares` folder.

## 1. Logger Middleware (TODO)
**Purpose:** Log every incoming request (method, URL, and time) so you can monitor traffic and debug issues.
**Where to use:** Globally, at the very top of your `server.ts` before your routes.

```typescript
// backend/middlewares/logger.middleware.ts
import { Request, Response, NextFunction } from "express";

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Always call next() so the request continues to the actual route!
  next(); 
};
```

---

## 2. Validation Middleware (TODO)
**Purpose:** Check if the incoming data (like `req.body`) has all required fields before hitting the controller.
**Where to use:** Only on specific routes that expect data (e.g., in `routes/chat.routes.ts`).

```typescript
// backend/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from "express";

export const validateChatRequest = (req: Request, res: Response, next: NextFunction) => {
  const { message, session } = req.body;

  // If data is missing, stop the request and return an error
  if (!message || !session) {
    return res.status(400).json({ 
      success: false, 
      error: "Both 'message' and 'session' are required fields." 
    });
  }

  // If everything is good, proceed to the controller
  next();
};
```

---

## 3. Auth Middleware (TODO)
**Purpose:** Protect private routes by checking for a valid token (like a JWT) in the headers.
**Where to use:** On protected routes or routers.

```typescript
// backend/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      error: "Unauthorized. No token provided." 
    });
  }

  const token = authHeader.split(" ")[1];

  // Dummy check (replace with actual JWT verification)
  if (token === "my-secret-test-token") {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      error: "Forbidden. Invalid token." 
    });
  }
};
```

---

## 4. 404 Middleware (TODO)
**Purpose:** Catch any request that doesn't match any defined routes.
**Where to use:** Globally, at the **very bottom** of route declarations in `server.ts`, but *before* the Error Handler.

```typescript
// backend/middlewares/notFound.middleware.ts
import { Request, Response, NextFunction } from "express";

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`
  });
};
```

---

## 5. Global Error Handler (TODO)
**Purpose:** Catch crashes or errors to prevent the server from dying.
**Where to use:** Globally, at the **absolute very bottom** of `server.ts`. Note the 4 parameters.

```typescript
// backend/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";

export const globalErrorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error("🔥 Global Error Caught:", err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
```

---

## 6. How to Wire Them Up in `server.ts`

Your `server.ts` should eventually look like this (order is critical):

```typescript
import express from "express";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

// 1. Global Middlewares
app.use(loggerMiddleware); // Logs everything
app.use(express.json());   // Parses JSON bodies

// 2. Routes (with route-specific middleware)
// e.g. app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/chat", chatRoutes);

// 3. Fallbacks and Error Handling
app.use(notFoundMiddleware);  // Catches 404s
app.use(globalErrorHandler);  // Catches server crashes

// ... rest of server setup ...
```
