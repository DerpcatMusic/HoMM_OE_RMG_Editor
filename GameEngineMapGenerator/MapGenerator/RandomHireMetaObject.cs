using Hex.Map;

namespace Hex.MapGenerator;

public class RandomHireMetaObject : MetaObjectDesc
{
	private readonly int tier;

	public RandomHireMetaObject(MetaObjectConfig config)
		: base(config.sid, "random-hire", MetaObjectType.RandomHire, config.value, config.guardValue, isBuilding: true)
	{
		if (config.args.Length != 0)
		{
			if (int.TryParse(config.args[0], out var result))
			{
				if (result >= 1 && result <= 7)
				{
					tier = result;
				}
				else
				{
					Log.ConfigError("Incorrect tier in generator meta object config '" + config.sid + "'.");
				}
			}
			else
			{
				Log.ConfigError("Couldn't parse tier in generator meta object config '" + config.sid + "'.");
			}
		}
		else
		{
			Log.ConfigError("Too few arguments in generator meta object config '" + config.sid + "'.");
		}
	}

	public override void AddProps(int id, MapObjectsRegistry registry, MapDescription mapDesc, int zoneID)
	{
		MapDescription.Zone zone = mapDesc.zones[zoneID];
		PropRandomHire propRandomHire = new PropRandomHire();
		propRandomHire.tier = tier;
		propRandomHire.fraction = ContentDatabase.GetMetaObjectFaction(zone.metaObjectsBiome);
		registry.AddProp(id, propRandomHire);
		PropGrowthUnits prop = new PropGrowthUnits
		{
			countGrowth = zone.randomHireInitialUnitIncrement,
			isConstantGrowth = zone.randomHireEnableWeeklyUnitIncrement
		};
		registry.AddProp(id, prop);
	}
}
