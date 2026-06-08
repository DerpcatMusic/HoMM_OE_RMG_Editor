using System;
using System.Collections.Generic;
using Hex.Configs;
using Hex.Map;
using Hex.Session;
using UnityEngine;

namespace Hex.MapGenerator;

public class ContentPool
{
	private class ContentGroup
	{
		public List<int> indices;

		public ContentGroup(ContentPool pool, Func<MapObjectDesc, bool> filter)
		{
			indices = new List<int>();
			for (int i = 0; i < pool.weightsTable.Descs.Count; i++)
			{
				if (filter(pool.weightsTable.Descs[i]))
				{
					indices.Add(i);
				}
			}
			indices.Sort((int index, int j) => pool.values[index].CompareTo(pool.values[j]));
		}

		public ContentGroup(ContentPool pool, ContentGroup group, Func<MapObjectDesc, bool> filter)
		{
			indices = new List<int>();
			foreach (int index in group.indices)
			{
				if (filter(pool.weightsTable.Descs[index]))
				{
					indices.Add(index);
				}
			}
			indices.Sort((int i, int j) => pool.values[i].CompareTo(pool.values[j]));
		}
	}

	public class DebugInfo
	{
		public int[,] buildingsInValueBrackets;

		public int[] pickupsInValueBracket;

		public DebugInfo(ContentPool pool)
		{
			int bracketCount = pool.valueDistribution.BracketCount;
			pickupsInValueBracket = new int[bracketCount];
			buildingsInValueBrackets = new int[bracketCount, 4];
			foreach (int index in pool.allInteractables.indices)
			{
				MapObjectDesc desc = pool.weightsTable.Descs[index];
				int value = pool.valueOverrides.GetValue(desc);
				int bracketForValue = pool.valueDistribution.GetBracketForValue(value);
				GeneratorObjectConfig generatorConfig = desc.mapConfig.generatorConfig;
				int num = Mathf.Max(generatorConfig.buildingSizeX, generatorConfig.buildingSizeZ);
				buildingsInValueBrackets[bracketForValue, 0]++;
				buildingsInValueBrackets[bracketForValue, num]++;
			}
			foreach (int index2 in pool.allPickups.indices)
			{
				MapObjectDesc desc2 = pool.weightsTable.Descs[index2];
				int value2 = pool.valueOverrides.GetValue(desc2);
				int bracketForValue2 = pool.valueDistribution.GetBracketForValue(value2);
				pickupsInValueBracket[bracketForValue2]++;
			}
		}
	}

	public ContentPoolConfig config;

	private ValueDistribution valueDistribution;

	private ValueOverrides valueOverrides;

	private ContentWeightsTable weightsTable;

	private List<int> values = new List<int>();

	private ContentGroup allInteractables;

	private ContentGroup allPickups;

	private Dictionary<BuildingKey, ContentGroup> buildingSlotGroups = new Dictionary<BuildingKey, ContentGroup>();

	private List<int> tempIndicies = new List<int>();

	private List<float> tempWeights = new List<float>();

	private DebugInfo debugInfo;

	private static readonly float[,] BuildingSlotAffinity = new float[3, 3]
	{
		{ 1f, 0f, 0f },
		{ 1f, 4f, 0f },
		{ 1f, 4f, 9f }
	};

	public ValueDistribution ValueDistribution => valueDistribution;

	public MapObjectDesc? GetContent(byte biome, System.Random random, int minValue = -1, int maxValue = -1, Limits limits = null)
	{
		tempIndicies.Clear();
		tempWeights.Clear();
		for (int i = 0; i < weightsTable.Descs.Count; i++)
		{
			if (!Utils.IsInValueBracket(values[i], minValue, maxValue))
			{
				continue;
			}
			MapObjectDesc desc = weightsTable.Descs[i];
			if (limits == null || !limits.IsLimitReached(desc))
			{
				float weight = weightsTable.GetWeight(i, biome);
				if (weight > 0f)
				{
					tempIndicies.Add(i);
					tempWeights.Add(weight);
				}
			}
		}
		if (tempWeights.Count == 0)
		{
			return null;
		}
		int index = tempIndicies[RngUtils.WeightedIndex(tempWeights, random)];
		return weightsTable.Descs[index];
	}

	public MapObjectDesc? GetBuilding(byte biome, EncounterTemplate encounter, int slotIndex, System.Random random, int minValue = -1, int maxValue = -1, Limits limits = null)
	{
		tempIndicies.Clear();
		tempWeights.Clear();
		BuildingSlot buildingSlot = encounter.buildings[slotIndex];
		foreach (int index2 in GetBuildingGroup(buildingSlot).indices)
		{
			if (!Utils.IsInValueBracket(values[index2], minValue, maxValue))
			{
				continue;
			}
			MapObjectDesc desc = weightsTable.Descs[index2];
			GeneratorObjectConfig generatorConfig = desc.mapConfig.generatorConfig;
			if ((limits == null || !limits.IsLimitReached(desc)) && EncounterUtils.CanFitBuilding(encounter, slotIndex, generatorConfig.buildingSizeX, generatorConfig.buildingSizeZ, generatorConfig.buildingInteractionLayout))
			{
				int num = Mathf.Max(generatorConfig.buildingSizeX, generatorConfig.buildingSizeZ);
				int num2 = Mathf.Max(buildingSlot.width, buildingSlot.height);
				float weight = weightsTable.GetWeight(index2, biome);
				weight *= BuildingSlotAffinity[num2 - 1, num - 1];
				if (weight > 0f)
				{
					tempIndicies.Add(index2);
					tempWeights.Add(weight);
				}
			}
		}
		if (tempWeights.Count == 0)
		{
			return null;
		}
		int index = tempIndicies[RngUtils.WeightedIndex(tempWeights, random)];
		return weightsTable.Descs[index];
	}

	public MapObjectDesc? GetPickup(byte biome, System.Random random, int minValue = -1, int maxValue = -1, Limits limits = null)
	{
		tempIndicies.Clear();
		tempWeights.Clear();
		foreach (int index2 in allPickups.indices)
		{
			if (!Utils.IsInValueBracket(values[index2], minValue, maxValue))
			{
				continue;
			}
			MapObjectDesc desc = weightsTable.Descs[index2];
			if (limits == null || !limits.IsLimitReached(desc))
			{
				float weight = weightsTable.GetWeight(index2, biome);
				if (weight > 0f)
				{
					tempIndicies.Add(index2);
					tempWeights.Add(weight);
				}
			}
		}
		if (tempWeights.Count == 0)
		{
			return null;
		}
		int index = tempIndicies[RngUtils.WeightedIndex(tempWeights, random)];
		return weightsTable.Descs[index];
	}

	public ContentPool(ContentPoolConfig config, ContentDatabase database, ValueOverrides valueOverrides, ConfigsCollection<ContentList> contentLists, BanInfo banInfo, bool heroHireBan)
	{
		this.config = config;
		this.valueOverrides = valueOverrides;
		valueDistribution = new ValueDistribution(config.valueDistribution, config.name);
		weightsTable = new ContentWeightsTable(database, banInfo);
		List<ContentID> list = new List<ContentID>();
		if (heroHireBan)
		{
			GeneratorConfig.GetHeroHireBans(list, null);
		}
		List<List<ContentWeight>> list2 = new List<List<ContentWeight>>();
		List<List<ContentID>> banLists = new List<List<ContentID>> { config.bans, list };
		foreach (ContentPoolConfig.Group group in config.groups)
		{
			list2.Clear();
			string[] includeLists = group.includeLists;
			foreach (string id in includeLists)
			{
				if (contentLists.TryGetById(id, out var value))
				{
					list2.Add(value.content);
				}
			}
			list2.Add(group.content);
			weightsTable.AddLists(list2, banLists, group.weight);
		}
		foreach (MapObjectDesc desc in weightsTable.Descs)
		{
			values.Add(valueOverrides.GetValue(desc));
		}
		allInteractables = new ContentGroup(this, (MapObjectDesc desc) => ContentDatabase.IsMapObjectBuilding(desc));
		allPickups = new ContentGroup(this, (MapObjectDesc desc) => !ContentDatabase.IsMapObjectBuilding(desc));
	}

	public DebugInfo GetDebugInfo()
	{
		if (debugInfo == null)
		{
			debugInfo = new DebugInfo(this);
		}
		return debugInfo;
	}

	private ContentGroup GetBuildingGroup(BuildingSlot buildingSlot)
	{
		BuildingKey key = new BuildingKey(buildingSlot.width, buildingSlot.height, buildingSlot.interaction);
		if (buildingSlotGroups.TryGetValue(key, out var value))
		{
			return value;
		}
		value = new ContentGroup(this, allInteractables, Filter);
		buildingSlotGroups[key] = value;
		return value;
		bool Filter(MapObjectDesc desc)
		{
			GeneratorObjectConfig generatorConfig = desc.mapConfig.generatorConfig;
			return EncounterUtils.CanFitBuilding(buildingSlot.width, buildingSlot.height, buildingSlot.interaction, generatorConfig.buildingSizeX, generatorConfig.buildingSizeZ, generatorConfig.buildingInteractionLayout, interactLeftFree: true, interactRightFree: true);
		}
	}
}
