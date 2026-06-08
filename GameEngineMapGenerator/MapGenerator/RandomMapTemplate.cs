using System;
using System.Collections.Generic;
using Hex.Configs;
using Hex.Map;

namespace Hex.MapGenerator
{
	[Serializable]
	public class RandomMapTemplate
	{
		[Serializable]
		public class Variant
		{
			public Orientation orientation;

			public Border border;

			public RiverSettings river;

			public Zone[] zones;

			public Connection[] connections;
		}

		[Serializable]
		public class Zone
		{
			public string name;

			public float size;

			public string layout;

			public MainObject[] mainObjects;

			public BiomeRule zoneBiome;

			public BiomeRule contentBiome;

			public BiomeRule metaObjectsBiome;

			public int crossroadsPosition;

			public string[] guardedContentPool;

			public string[] unguardedContentPool;

			public string[] resourcesContentPool;

			public string[] contentCountLimits;

			public int guardedContentValue;

			public int guardedContentValuePerArea;

			public int unguardedContentValue;

			public int unguardedContentValuePerArea;

			public int resourcesValue;

			public int resourcesValuePerArea;

			public bool[] randomHireEnableWeeklyUnitIncrement;

			public int[] randomHireInitialUnitIncrement;

			public float diplomacyModifier;

			public int guardCutoffValue;

			public float guardMultiplier;

			public float guardRandomization;

			public float guardWeeklyIncrement;

			public float[] guardReactionDistribution;

			public EncounterHolesSettings encounterHolesSettings;

			public RoadConfig[] roads;

			public string[] mandatoryContent;
		}

		[Serializable]
		public class Connection
		{
			public string name;

			public string from;

			public string to;

			public string connectionType;

			public float length;

			public bool portalFromEnabled;

			public bool portalToEnabled;

			public string guardZone;

			public int guardValue;

			public float guardWeeklyIncrement;

			public string guardReaction;

			public bool guardEscape;

			public string guardMatchGroup;

			public string gatePlacement;

			public string[] gatePlacementArgs;

			public PlacementRule[] portalPlacementRulesFrom;

			public PlacementRule[] portalPlacementRulesTo;

			[NonSerialized]
			public int indexFrom;

			[NonSerialized]
			public int indexTo;

			[NonSerialized]
			public ConnectionType connectionTypeEnum;

			[NonSerialized]
			public ESquadReactionType guardReactionEnum;

			[NonSerialized]
			public GatePlacement gatePlacementEnum;
		}

		[Serializable]
		public class MainObject
		{
			public string type;

			public string spawn;

			public string owner;

			public bool isKeyObject;

			public bool holdCityWinCon;

			public string placement;

			public string[] placementArgs;

			public FactionRule faction;

			public bool enableWeeklyUnitIncrement;

			public int initialUnitIncrement;

			public float guardChance;

			public int guardValue;

			public float guardWeeklyIncrement;

			public float guardRandomization;

			public bool removeGuardIfHasOwner;

			public string buildingsConstructionSid;

			public string buildingsBanSid;

			[NonSerialized]
			public MainObjectType typeEnum;

			[NonSerialized]
			public MainObjectPlacement placementEnum;

			[NonSerialized]
			public ESpawn spawnEnum;

			[NonSerialized]
			public ESpawn? ownerEnum;
		}

		[Serializable]
		public class MandatoryContent
		{
			public string name;

			public string[] includeLists;

			public List<ContentWeight> content;

			public string sid;

			public int variant;

			public PlacementRule[] rules;

			public bool designatedEncounter;

			public bool soloEncounter;

			public bool isGuarded;

			public bool isMine;

			public string owner;

			[NonSerialized]
			public ESpawn? ownerEnum;
		}

		[Serializable]
		public class MandatoryContentPreset
		{
			public string name;

			public MandatoryContent[] content;
		}

		[Serializable]
		public class ContentCountLimitPreset
		{
			public string name;

			public ContentCountLimit[] limits;
		}

		[Serializable]
		public class GlobalBans
		{
			public List<string> magics;

			public List<string> items;

			public List<string> skills;

			public List<string> heroes;

			public List<string> units;
		}

		[NonSerialized]
		public string jsonText;

		public string name;

		public string description;

		public string gameMode;

		public string displayWinCondition;

		public int sizeX;

		public int sizeZ;

		public GameRules gameRules;

		public GlobalBans globalBans;

		public ContentValueOverride[] valueOverrides;

		public Variant[] variants;

		public ZoneLayoutConfig[] zoneLayouts;

		public MandatoryContentPreset[] mandatoryContent;

		public ContentCountLimitPreset[] contentCountLimits;

		public ContentPoolConfig[] contentPools;

		public ContentList[] contentLists;
	}
}
