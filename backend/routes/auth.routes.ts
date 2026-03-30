import { Router } from "express"
import { loginUser, registerUser } from "../controlleers/auth.controller";

const router = Router();

router.post('/register', registerUser)
router.post('/login', loginUser)

export default router