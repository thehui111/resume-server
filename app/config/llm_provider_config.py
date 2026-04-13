"""
LLM提供商配置管理
支持多个OpenRouter兼容的API提供商，并支持一键全局切换
"""
import json
from typing import Optional, Dict, Any, List, Iterator
from pydantic import BaseModel
from app.lib.cached_server_setting import APP_CONFIG

# 提供商类型定义改为完全动态字符串（不再使用固定枚举）
LLMProvider = str


class DynamicProviderList:
    def __iter__(self) -> Iterator[str]:
        return iter(LLMProviderConfig.get_all_providers())

    def __contains__(self, item: object) -> bool:
        if not isinstance(item, str):
            return False
        return item in set(LLMProviderConfig.get_all_providers())

    def __len__(self) -> int:
        return len(LLMProviderConfig.get_all_providers())

    def __repr__(self) -> str:
        return repr(LLMProviderConfig.get_all_providers())


SUPPORTED_PROVIDERS = DynamicProviderList()


class ProviderConfig(BaseModel):
    name: str
    api_base: str = ""
    api_key: str = ""
    need_model_prefix: bool = True
    prefix_map: Optional[Dict[str, str]] = None
    model_name_mappings: Optional[Dict[str, str]] = None
    type: str = "openai_compatible"
    price_rank: int = 100
    enabled: bool = True

    def is_configured(self) -> bool:
        """检查提供商是否已正确配置"""
        # Vertex AI 只需要 api_key，不需要 api_base
        if self.name == "google_official":
            return bool(self.api_key)
        return bool(self.api_key and self.api_base)


class LLMProviderConfig:
    """LLM提供商配置管理器"""

    @classmethod
    def _load_registry(cls) -> Dict[str, ProviderConfig]:
        registry: Dict[str, ProviderConfig] = {}
        agg_raw = None
        try:
            agg_raw = APP_CONFIG.v("provider.llm")
        except Exception:
            agg_raw = None
        if not agg_raw:
            return registry
        try:
            agg_val = json.loads(agg_raw)
            providers_list: List[Dict[str, Any]] = []
            if isinstance(agg_val, list):
                providers_list = [x for x in agg_val if isinstance(x, dict)]
            elif isinstance(agg_val, dict):
                if isinstance(agg_val.get("providers"), list):
                    providers_list = [
                        x for x in agg_val.get("providers") if isinstance(x, dict)
                    ]
                else:
                    for k, v in agg_val.items():
                        if isinstance(v, dict):
                            if "name" not in v:
                                v["name"] = str(k)
                            providers_list.append(v)
            for data in providers_list:
                name = str(data.get("name") or "").strip()
                if not name:
                    continue
                cfg = ProviderConfig(
                    name=name,
                    api_base=data.get("api_base", ""),
                    api_key=data.get("api_key", ""),
                    need_model_prefix=bool(
                        data.get("normalize", {}).get(
                            "need_prefix", data.get("need_model_prefix", True)
                        )
                    ),
                    prefix_map=data.get("normalize", {}).get("prefix_map")
                    or data.get("prefix_map"),
                    model_name_mappings=data.get("normalize", {}).get(
                        "model_name_mappings"
                    )
                    or data.get("model_name_mappings"),
                    type=str(data.get("type", "openai_compatible")),
                    price_rank=int(data.get("price_rank", 100)),
                    enabled=bool(data.get("enabled", True)),
                )
                if cfg.enabled:
                    registry[name] = cfg
        except Exception:
            return registry
        return registry

    @classmethod
    def get_provider_config(cls, provider: LLMProvider) -> ProviderConfig:
        reg = cls._load_registry()
        if provider in reg:
            return reg[provider]
        # 仅使用配置中心的动态配置；没有静态回退
        # 返回一个未配置的占位对象，调用方会通过 is_configured() 判断并跳过
        return ProviderConfig(
            name=str(provider),
            api_base="",
            api_key="",
            need_model_prefix=True,
            enabled=False,
        )

    @classmethod
    def get_all_providers(cls) -> list:
        reg = cls._load_registry()
        return list(reg.keys())

    @classmethod
    def get_price_sorted_providers(cls) -> list:
        reg = cls._load_registry()
        items = [
            (n, c.price_rank)
            for n, c in reg.items()
            if c.enabled and c.is_configured()
        ]
        items.sort(key=lambda x: x[1])
        return [n for n, _ in items]

    @classmethod
    def normalize_model_name(cls, model_name: str, provider: LLMProvider) -> str:
        """
        根据提供商规范化模型名称
        """
        config = cls.get_provider_config(provider)
        clean_name = model_name.replace("google/", "").replace("anthropic/", "")
        mappings = getattr(config, "model_name_mappings", None)
        if mappings and clean_name in mappings:
            return mappings[clean_name]
        if config.need_model_prefix:
            pm = config.prefix_map or {}
            if "gemini" in clean_name:
                pref = pm.get("gemini", "google/")
                return f"{pref}{clean_name}"
            if "claude" in clean_name:
                pref = pm.get("claude", "anthropic/")
                return f"{pref}{clean_name}"
            return clean_name
        return clean_name


# 导出配置实例
llm_provider_config = LLMProviderConfig()
