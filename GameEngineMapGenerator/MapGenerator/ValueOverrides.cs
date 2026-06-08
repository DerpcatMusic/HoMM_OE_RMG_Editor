using System.Collections.Generic;

namespace Hex.MapGenerator;

public class ValueOverrides
{
	private Dictionary<ContentKey, ContentValueOverride> valueOverrides = new Dictionary<ContentKey, ContentValueOverride>();

	public IEnumerable<ContentValueOverride> All => valueOverrides.Values;

	public ValueOverrides(ContentValueOverride[] overrides)
	{
		foreach (ContentValueOverride contentValueOverride in overrides)
		{
			valueOverrides[new ContentKey(contentValueOverride.sid, contentValueOverride.variant)] = contentValueOverride;
		}
	}

	public int GetValue(MapObjectDesc desc)
	{
		if (valueOverrides.TryGetValue(new ContentKey(desc.Sid, desc.variant), out var value) && value.goodsValue > 0)
		{
			return value.goodsValue;
		}
		if (desc.metaObjectDesc != null)
		{
			return desc.metaObjectDesc.value;
		}
		if (desc.logicConfig == null)
		{
			return 0;
		}
		return desc.logicConfig.GetValue(desc.variant);
	}

	public int GetGuardValue(MapObjectDesc desc)
	{
		if (valueOverrides.TryGetValue(new ContentKey(desc.Sid, desc.variant), out var value) && value.guardValue > 0)
		{
			return value.guardValue;
		}
		if (desc.metaObjectDesc != null)
		{
			int guardValue = desc.metaObjectDesc.guardValue;
			if (guardValue >= 0)
			{
				return guardValue;
			}
			return desc.metaObjectDesc.value;
		}
		if (desc.logicConfig == null)
		{
			return 0;
		}
		int value2 = GetValue(desc);
		return desc.logicConfig.GetGuardValue(value2, desc.variant);
	}
}
