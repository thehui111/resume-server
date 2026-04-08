from enum import Enum


class ErrorCode(Enum):
    # Auth
    EMAIL_ALREADY_EXISTS = (1001, "邮箱已被注册")
    INVALID_CREDENTIALS = (1002, "邮箱或密码错误")
    TOKEN_INVALID = (1003, "Token 无效或已过期")

    # Resume
    RESUME_NOT_FOUND = (4001, "简历不存在")
    SECTION_NOT_FOUND = (4002, "简历模块不存在")
    RESUME_ACCESS_DENIED = (4003, "无权限访问该简历")

    # Template
    TEMPLATE_NOT_FOUND = (4010, "模板不存在")

    # AI
    AI_GENERATE_FAILED = (5001, "AI 生成失败，请重试")
    AI_OPTIMIZE_FAILED = (5002, "AI 优化失败，请重试")

    # Export
    PDF_EXPORT_FAILED = (5010, "PDF 导出失败")

    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
