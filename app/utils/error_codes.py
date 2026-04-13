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
    AI_POLISH_FAILED = (5003, "AI 文本润色失败")

    # Export
    PDF_EXPORT_FAILED = (5010, "PDF 导出失败")

    # Avatar
    AVATAR_SERVICE_NOT_CONFIGURED = (5030, "头像优化服务未配置")
    AVATAR_OPTIMIZE_FAILED = (5031, "头像优化失败")
    AVATAR_OPTIMIZE_EMPTY = (5032, "头像优化返回结果为空")
    AVATAR_BG_CHANGE_FAILED = (5033, "头像背景修改失败")
    AVATAR_BG_CHANGE_EMPTY = (5034, "头像背景修改返回结果为空")

    # Image Generation
    IMAGE_SERVICE_NOT_CONFIGURED = (5040, "生图服务未配置 VIDEO_BASE_URL")
    BANANA_GENERATE_FAILED = (5041, "Banana 生图失败")
    BANANA_GENERATE_EMPTY = (5042, "Banana 生图返回结果为空")
    SEEDREAM_GENERATE_FAILED = (5043, "Seedream 生图失败")
    SEEDREAM_GENERATE_EMPTY = (5044, "Seedream 生图返回结果为空")
    IMAGE_EDIT_FAILED = (5045, "图片编辑失败")
    IMAGE_EDIT_EMPTY = (5046, "图片编辑返回结果为空")

    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
