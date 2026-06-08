using Hex.Configs;
using Hex.Map;

namespace Hex.MapGenerator;

public class RandomItemMetaObject : MetaObjectDesc
{
	private readonly ERarity rarity;

	public RandomItemMetaObject(MetaObjectConfig config)
		: base(config.sid, "random-item", MetaObjectType.RandomItem, config.value, config.guardValue, isBuilding: false)
	{
		if (config.args.Length != 0)
		{
			if (!EnumParser.TryParceEnum<ERarity>(config.args[0], out rarity))
			{
				Log.ConfigError("Couldn't parse meta object rarity in '" + config.sid + "'");
			}
		}
		else
		{
			Log.ConfigError("Too few arguments in generator meta object config '" + config.sid + "'.");
		}
	}

	public override void AddProps(int id, MapObjectsRegistry registry, MapDescription mapDesc, int zoneID)
	{
		PropRandomItem propRandomItem = new PropRandomItem();
		propRandomItem.rarity = rarity;
		registry.AddProp(id, propRandomItem);
	}
}
