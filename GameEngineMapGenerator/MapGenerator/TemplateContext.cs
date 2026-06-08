using System.Collections.Generic;
using Hex.Configs;
using Hex.Map;
using Hex.Session;

namespace Hex.MapGenerator;

public class TemplateContext
{
	private ContentDatabase database;

	private RandomMapTemplate template;

	private BanInfo banInfo;

	private ValueOverrides valueOverrides;

	private ConfigsCollection<ZoneLayoutConfig> zoneLayoutCollection;

	private ConfigsCollection<ContentPoolConfig> contentPoolCollection;

	private ConfigsCollection<ContentList> contentListCollection;

	private ConfigsCollection<RandomMapTemplate.MandatoryContentPreset> mandatoryContentCollection;

	private ConfigsCollection<RandomMapTemplate.ContentCountLimitPreset> contentCountLimitCollection;

	private Dictionary<string, ContentPool> contentPoolCache = new Dictionary<string, ContentPool>();

	public int HeroPoolCount { get; private set; }

	public ConfigsCollection<ZoneLayoutConfig> ZoneLayouts => zoneLayoutCollection;

	public ConfigsCollection<ContentList> ContentLists => contentListCollection;

	public ConfigsCollection<RandomMapTemplate.MandatoryContentPreset> MandatoryContentPresets => mandatoryContentCollection;

	public ConfigsCollection<RandomMapTemplate.ContentCountLimitPreset> ContentCountLimitPresets => contentCountLimitCollection;

	public BanInfo BanInfo => banInfo;

	public ValueOverrides ValueOverrides => valueOverrides;

	public TemplateContext(RandomMapTemplate template, GeneratorConfig config)
	{
		this.template = template;
		database = config.GetContent();
		banInfo = new BanInfo(new BanInfoData
		{
			bannedMagics = template.globalBans.magics,
			bannedItems = template.globalBans.items,
			bannedSkills = template.globalBans.skills,
			bannedHeroes = template.globalBans.heroes,
			bannedUnits = template.globalBans.units
		}, null, null);
		valueOverrides = new ValueOverrides(template.valueOverrides);
		string[] availableFractions = DB.Instance().dataInc.availableFractions;
		HeroPoolCount = 0;
		string[] array = availableFractions;
		foreach (string id in array)
		{
			foreach (string hero in DB.me.fractions.Get(id).heroes)
			{
				BannedHeroInfo bannedHeroInfo = banInfo.BannedHeroInfo;
				if (!bannedHeroInfo.IsRemovedFromSkirmish(hero) && !bannedHeroInfo.IsBanned(hero))
				{
					HeroPoolCount++;
				}
			}
		}
		if (template.zoneLayouts != null)
		{
			zoneLayoutCollection = new ConfigsCollection<ZoneLayoutConfig>((ZoneLayoutConfig c) => c.name);
			zoneLayoutCollection.CreateFromArray(template.zoneLayouts);
			zoneLayoutCollection.AddReference(config.GetZoneLayoutConfigs());
		}
		else
		{
			zoneLayoutCollection = config.GetZoneLayoutConfigs();
		}
		if (template.contentPools != null)
		{
			contentPoolCollection = new ConfigsCollection<ContentPoolConfig>((ContentPoolConfig c) => c.name);
			contentPoolCollection.CreateFromArray(template.contentPools);
			contentPoolCollection.AddReference(config.GetContentPoolConfigs());
		}
		else
		{
			contentPoolCollection = config.GetContentPoolConfigs();
		}
		if (template.contentLists != null)
		{
			contentListCollection = new ConfigsCollection<ContentList>((ContentList c) => c.name);
			contentListCollection.CreateFromArray(template.contentLists);
			contentListCollection.AddReference(config.GetContentLists());
		}
		else
		{
			contentListCollection = config.GetContentLists();
		}
		mandatoryContentCollection = new ConfigsCollection<RandomMapTemplate.MandatoryContentPreset>((RandomMapTemplate.MandatoryContentPreset c) => c.name);
		mandatoryContentCollection.CreateFromArray(template.mandatoryContent);
		contentCountLimitCollection = new ConfigsCollection<RandomMapTemplate.ContentCountLimitPreset>((RandomMapTemplate.ContentCountLimitPreset c) => c.name);
		contentCountLimitCollection.CreateFromArray(template.contentCountLimits);
	}

	public ZoneLayoutConfig GetZoneLayoutConfig(string id)
	{
		if (!zoneLayoutCollection.TryGetById(id, out var value))
		{
			throw new GeneratorException("Couldn't find zone layout '" + id + "'", Log.Context.none);
		}
		return value;
	}

	public ContentPool GetContentPool(string id)
	{
		if (contentPoolCache.TryGetValue(id, out var value))
		{
			return value;
		}
		if (!contentPoolCollection.TryGetById(id, out var value2))
		{
			Log.ConfigError("Couldn't find content pool '" + id + "'.");
		}
		value = new ContentPool(value2, database, valueOverrides, contentListCollection, banInfo, template.gameRules.heroHireBan);
		contentPoolCache[id] = value;
		return value;
	}
}
