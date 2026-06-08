using System.Collections.Generic;
using Hex.Configs;
using Hex.Map;
using Hex.Session;

namespace Hex.MapGenerator;

public class MapDescription
{
	public class Zone
	{
		public string name;

		public float size;

		public ZoneLayoutConfig layout;

		public List<MainObject> mainObjects;

		public byte zoneBiome;

		public byte contentBiome;

		public byte metaObjectsBiome;

		public int crossroadsPosition;

		public ContentPool guardedContentPool;

		public ContentPool unguardedContentPool;

		public ContentPool resourcesContentPool;

		public int guardedContentValue;

		public int guardedContentValuePerArea;

		public int unguardedContentValue;

		public int unguardedContentValuePerArea;

		public int resourcesValue;

		public int resourcesValuePerArea;

		public bool randomHireEnableWeeklyUnitIncrement;

		public int randomHireInitialUnitIncrement;

		public float diplomacyModifier;

		public int guardCutoffValue;

		public float guardMultiplier;

		public float guardRandomization;

		public float guardWeeklyIncrement;

		public float[] guardReactionDistribution;

		public EncounterHolesSettings encounterHolesSettings;

		public List<Road> roads;

		public List<MandatoryContent> mandatoryContent;

		public List<ContentCountLimit> contentCountLimits;
	}

	public class Connection
	{
		public string name;

		public int from;

		public int to;

		public ConnectionType connectionType;

		public float length;

		public bool portalFromEnabled;

		public bool portalToEnabled;

		public int guardZone;

		public int guardValue;

		public float guardWeeklyIncrement;

		public ESquadReactionType guardReaction;

		public bool guardEscape;

		public string guardMatchGroup;

		public GatePlacement gatePlacement;

		public string[] gatePlacementArgs;

		public List<PlacementRule> portalPlacementRulesFrom;

		public List<PlacementRule> portalPlacementRulesTo;
	}

	public class MainObject
	{
		public MainObjectType type;

		public ESpawn spawn;

		public ESpawn? owner;

		public bool isKeyObject;

		public MainObjectPlacement placement;

		public string[] placementArgs;

		public string faction;

		public bool enableWeeklyUnitIncrement;

		public int initialUnitIncrement;

		public float guardChance;

		public int guardValue;

		public float guardWeeklyIncrement;

		public float guardRandomization;

		public bool removeGuardIfHasOwner;

		public string buildingsConstructionSid;

		public string buildingsBanSid;
	}

	public class MandatoryContent
	{
		public string name;

		public List<ContentWeight> content;

		public string sid;

		public int variant;

		public List<PlacementRule> rules;

		public bool designatedEncounter;

		public bool soloEncounter;

		public bool isGuarded;

		public bool isMine;

		public ESpawn? owner;
	}

	public struct Road
	{
		public RoadType roadType;

		public RoadTargetType typeFrom;

		public int indexFrom;

		public RoadTargetType typeTo;

		public int indexTo;
	}

	public struct PlacementRule
	{
		public PlacementRuleType type;

		public float target;

		public float targetMin;

		public float targetMax;

		public float weight;

		public string sid;

		public int mainObjectIndex;

		public int connectionIndex;

		public int mandatoryContentIndex;

		public Hex.MapGenerator.PlacementRule config;
	}

	public class ContentCountLimit
	{
		public List<ContentID> content = new List<ContentID>();

		public string sid;

		public int variant = -1;

		public string biome;

		public int maxCount = 1;
	}

	public RandomMapTemplate template;

	public int templateVariant;

	public string name;

	public int sizeX;

	public int sizeZ;

	public int seed;

	public Orientation orientation;

	public Border border;

	public RiverSettings river;

	public GameRules gameRules;

	public ValueOverrides valueOverrides;

	public BanInfo banInfo;

	public int heroPoolCount;

	public List<Zone> zones;

	public List<Connection> connections;

	public ContentTask contentTask;

	public static readonly float[] DefaultGuardReactionDistribution = new float[6] { 1f, 1f, 1f, 1f, 1f, 0f };
}
