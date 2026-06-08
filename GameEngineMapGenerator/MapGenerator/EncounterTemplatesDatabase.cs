using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class EncounterTemplatesDatabase
{
	public class Group
	{
		private EncounterTemplatesDatabase cache;

		private Dictionary<Footprint, List<int>> baseTemplateIndicesByFootprint;

		private Dictionary<int, Vector4> variantSelectionByBaseTemplateIndex;

		private List<float> tempWeightList = new List<float>();

		private Footprint[] footprints;

		private Footprint[] shuffledFootprints;

		public EncounterTemplate PickRandomTemplateForFootprint(Footprint footprint, System.Random random)
		{
			List<int> list = baseTemplateIndicesByFootprint[footprint];
			tempWeightList.Clear();
			foreach (int item in list)
			{
				tempWeightList.Add(cache.weights[item]);
			}
			int num = list[RngUtils.WeightedIndex(tempWeightList, random)];
			return cache.GetMirrorVariantForFootprint(num, footprint, variantSelectionByBaseTemplateIndex[num]);
		}

		public Group(EncounterTemplatesDatabase cache, List<TemplateSelection> templates)
		{
			this.cache = cache;
			baseTemplateIndicesByFootprint = new Dictionary<Footprint, List<int>>();
			variantSelectionByBaseTemplateIndex = new Dictionary<int, Vector4>();
			HashSet<Footprint> hashSet = new HashSet<Footprint>();
			HashSet<Footprint> hashSet2 = new HashSet<Footprint>();
			foreach (TemplateSelection template in templates)
			{
				int baseTemplateIndex = template.baseTemplateIndex;
				variantSelectionByBaseTemplateIndex.Add(baseTemplateIndex, template.isMirrorVariantAvailable);
				hashSet2.Clear();
				for (int i = 0; i < 4; i++)
				{
					if (template.isMirrorVariantAvailable[i] > 0f)
					{
						HashSet<Footprint> hashSet3 = cache.footprintsByMirrorVariantIndex[baseTemplateIndex * 4 + i];
						if (hashSet3 != null)
						{
							hashSet2.UnionWith(hashSet3);
						}
					}
				}
				hashSet.UnionWith(hashSet2);
				foreach (Footprint item in hashSet2)
				{
					if (baseTemplateIndicesByFootprint.TryGetValue(item, out var value))
					{
						value.Add(baseTemplateIndex);
						continue;
					}
					baseTemplateIndicesByFootprint.Add(item, new List<int> { baseTemplateIndex });
				}
			}
			footprints = new Footprint[hashSet.Count];
			shuffledFootprints = new Footprint[hashSet.Count];
			int num = 0;
			foreach (Footprint item2 in hashSet)
			{
				footprints[num] = item2;
				shuffledFootprints[num] = item2;
				num++;
			}
		}

		public bool TryPickFootprint(out Footprint footprint, AvailableRects availableRects)
		{
			Footprint[] array = shuffledFootprints;
			foreach (Footprint footprint2 in array)
			{
				if (availableRects.DoesFootprintFit(footprint2))
				{
					footprint = footprint2;
					return true;
				}
			}
			footprint = default(Footprint);
			return false;
		}

		public void ShuffleFootprints(System.Random random)
		{
			for (int i = 0; i < footprints.Length; i++)
			{
				shuffledFootprints[i] = footprints[i];
			}
			RngUtils.Shuffle(shuffledFootprints, random);
		}
	}

	public struct TemplateSelection
	{
		public readonly int baseTemplateIndex;

		public readonly Vector4 isMirrorVariantAvailable;

		public TemplateSelection(int baseTemplateIndex)
		{
			this.baseTemplateIndex = baseTemplateIndex;
			isMirrorVariantAvailable = new Vector4(1f, 1f, 1f, 1f);
		}

		public TemplateSelection(int baseTemplateIndex, Vector4 isMirrorVariantAvailable)
		{
			this.baseTemplateIndex = baseTemplateIndex;
			this.isMirrorVariantAvailable = isMirrorVariantAvailable;
		}
	}

	public struct BuildingGroupKey : IEquatable<BuildingGroupKey>
	{
		public readonly int width;

		public readonly int height;

		public readonly InteractionLayout interact;

		public uint contentMask;

		public BuildingGroupKey(int width, int height, InteractionLayout interact, uint contentMask)
		{
			this.width = width;
			this.height = height;
			this.interact = interact;
			this.contentMask = contentMask;
		}

		public bool Equals(BuildingGroupKey other)
		{
			if (width == other.width && height == other.height && interact == other.interact)
			{
				return contentMask == other.contentMask;
			}
			return false;
		}

		public override int GetHashCode()
		{
			return Utils.CombineHashes(Utils.CombineHashes(Utils.CombineHashes(width.GetHashCode(), height.GetHashCode()), (int)interact), (int)contentMask);
		}
	}

	public static readonly InteractionLayout[] InteractionLayouts = new InteractionLayout[3]
	{
		InteractionLayout.CornerLeft,
		InteractionLayout.Bottom,
		InteractionLayout.All
	};

	private float[] weights;

	private EncounterTemplate[] baseTemplates;

	private EncounterTemplate[] mirrorVariantTemplates;

	private HashSet<Footprint>[] footprintsByBaseTemplateIndex;

	private HashSet<Footprint>[] footprintsByMirrorVariantIndex;

	private Dictionary<BuildingGroupKey, Group> groupByBuildingTypeCommon;

	private Dictionary<BuildingGroupKey, Group> groupByBuildingTypeUnguarded;

	private Dictionary<uint, Group> guaranteedPickupsGroupCommon;

	private Dictionary<uint, Group> guaranteedPickupsGroupUnguarded;

	private Group cityGroup;

	private Group mineGroup;

	private Group portalGroup;

	private Group gladiatorArenaGroup;

	public EncounterTemplatesDatabase(List<EncounterTemplate> templates)
	{
		LoadTemplates(templates);
		InitLookups();
		cityGroup = CreateTypeGroup(EncounterTemplateType.City);
		mineGroup = CreateTypeGroup(EncounterTemplateType.Mine);
		portalGroup = CreateTypeGroup(EncounterTemplateType.Portal);
		gladiatorArenaGroup = CreateTypeGroup(EncounterTemplateType.GladiatorArena);
		groupByBuildingTypeCommon = new Dictionary<BuildingGroupKey, Group>();
		groupByBuildingTypeUnguarded = new Dictionary<BuildingGroupKey, Group>();
		guaranteedPickupsGroupCommon = new Dictionary<uint, Group>();
		guaranteedPickupsGroupUnguarded = new Dictionary<uint, Group>();
	}

	public Group GetCityGroup()
	{
		return cityGroup;
	}

	public Group GetMineGroup()
	{
		return mineGroup;
	}

	public Group GetPortalGroup()
	{
		return portalGroup;
	}

	public Group GetGladiatorArenaGroup()
	{
		return gladiatorArenaGroup;
	}

	public Group GetGuaranteedPickupsGroup(uint contentMask, bool solo, EncounterTemplateType encounterType)
	{
		Group value = null;
		contentMask = ((!solo) ? (contentMask | (uint)(1 << EncounterUtils.GetPickupMaskIndex())) : 0u);
		switch (encounterType)
		{
		case EncounterTemplateType.Common:
			if (!guaranteedPickupsGroupCommon.TryGetValue(contentMask, out value))
			{
				value = CreateGroupWithGuaranteedPickups(1, contentMask, EncounterTemplateType.Common);
				guaranteedPickupsGroupCommon[contentMask] = value;
			}
			break;
		case EncounterTemplateType.Unguarded:
			if (!guaranteedPickupsGroupUnguarded.TryGetValue(contentMask, out value))
			{
				value = CreateGroupWithGuaranteedPickups(1, contentMask, EncounterTemplateType.Unguarded);
				guaranteedPickupsGroupUnguarded[contentMask] = value;
			}
			break;
		}
		return value;
	}

	public Group GetGroupForBuilding(int width, int height, InteractionLayout interactionLayout, uint contentMask, bool solo, EncounterTemplateType encounterType)
	{
		Group value = null;
		contentMask = ((!solo) ? (contentMask | (uint)(1 << EncounterUtils.GetBuildingMaskIndex(width, height, interactionLayout))) : 0u);
		BuildingGroupKey key = new BuildingGroupKey(width, height, interactionLayout, contentMask);
		switch (encounterType)
		{
		case EncounterTemplateType.Common:
			if (!groupByBuildingTypeCommon.TryGetValue(key, out value))
			{
				value = CreateBuildingGroup(width, height, interactionLayout, contentMask, EncounterTemplateType.Common);
				groupByBuildingTypeCommon[key] = value;
			}
			break;
		case EncounterTemplateType.Unguarded:
			if (!groupByBuildingTypeUnguarded.TryGetValue(key, out value))
			{
				value = CreateBuildingGroup(width, height, interactionLayout, contentMask, EncounterTemplateType.Unguarded);
				groupByBuildingTypeUnguarded[key] = value;
			}
			break;
		}
		return value;
	}

	public EncounterTemplate GetMirrorVariantForFootprint(int baseTemplateIndex, Footprint footprint, Vector4 selection)
	{
		for (int i = 0; i < 4; i++)
		{
			HashSet<Footprint> hashSet = footprintsByMirrorVariantIndex[baseTemplateIndex * 4 + i];
			if (selection[i] > 0f && hashSet != null && hashSet.Contains(footprint))
			{
				return mirrorVariantTemplates[baseTemplateIndex * 4 + i];
			}
		}
		return null;
	}

	private void LoadTemplates(List<EncounterTemplate> list)
	{
		List<EncounterTemplate> list2 = new List<EncounterTemplate>();
		foreach (EncounterTemplate item in list)
		{
			if (EncounterUtils.Validate(item))
			{
				list2.Add(item);
			}
		}
		baseTemplates = list2.ToArray();
	}

	private void InitLookups()
	{
		int num = baseTemplates.Length;
		weights = new float[num];
		mirrorVariantTemplates = new EncounterTemplate[num * 4];
		footprintsByBaseTemplateIndex = new HashSet<Footprint>[num];
		footprintsByMirrorVariantIndex = new HashSet<Footprint>[num * 4];
		for (int i = 0; i < num; i++)
		{
			EncounterTemplate encounterTemplate = baseTemplates[i];
			weights[i] = encounterTemplate.relativeFrequency;
			HashSet<Footprint> hashSet = FootprintsForVariant(encounterTemplate);
			HashSet<Footprint> hashSet2 = FootprintsForVariant(encounterTemplate);
			mirrorVariantTemplates[i * 4] = encounterTemplate;
			footprintsByMirrorVariantIndex[i * 4] = hashSet2;
			if (encounterTemplate.allowMirrorX)
			{
				EncounterTemplate mirroredByX = encounterTemplate.GetMirroredByX();
				mirrorVariantTemplates[i * 4 + 1] = mirroredByX;
				hashSet2 = FootprintsForVariant(mirroredByX);
				footprintsByMirrorVariantIndex[i * 4 + 1] = hashSet2;
				hashSet.UnionWith(hashSet2);
			}
			if (encounterTemplate.allowMirrorY)
			{
				EncounterTemplate mirroredByX = encounterTemplate.GetMirroredByY();
				mirrorVariantTemplates[i * 4 + 2] = mirroredByX;
				hashSet2 = FootprintsForVariant(mirroredByX);
				footprintsByMirrorVariantIndex[i * 4 + 2] = hashSet2;
				hashSet.UnionWith(hashSet2);
			}
			if (encounterTemplate.allowMirrorX && encounterTemplate.allowMirrorY)
			{
				EncounterTemplate mirroredByX = encounterTemplate.GetMirroredByX().GetMirroredByY();
				mirrorVariantTemplates[i * 4 + 3] = mirroredByX;
				hashSet2 = FootprintsForVariant(mirroredByX);
				footprintsByMirrorVariantIndex[i * 4 + 3] = hashSet2;
				hashSet.UnionWith(hashSet2);
			}
			footprintsByBaseTemplateIndex[i] = hashSet;
		}
	}

	private Group CreateBuildingGroup(int width, int height, InteractionLayout interactionLayout, uint contentMask, EncounterTemplateType templateType)
	{
		List<TemplateSelection> list = new List<TemplateSelection>();
		for (int i = 0; i < baseTemplates.Length; i++)
		{
			if (baseTemplates[i].encounterType != templateType)
			{
				continue;
			}
			Vector4 zero = Vector4.zero;
			for (int j = 0; j < 4; j++)
			{
				EncounterTemplate encounterTemplate = mirrorVariantTemplates[i * 4 + j];
				if (encounterTemplate == null)
				{
					continue;
				}
				if (contentMask == 0)
				{
					if (encounterTemplate.buildings.Length > 1 || encounterTemplate.pickups.Length != 0)
					{
						continue;
					}
				}
				else if (!EncounterUtils.CheckContentMask(encounterTemplate, contentMask))
				{
					continue;
				}
				for (int k = 0; k < encounterTemplate.buildings.Length; k++)
				{
					BuildingSlot buildingSlot = encounterTemplate.buildings[k];
					if ((buildingSlot.width == width || buildingSlot.height == height) && EncounterUtils.CanFitBuilding(encounterTemplate, k, width, height, interactionLayout))
					{
						zero[j] = 1f;
						break;
					}
				}
			}
			if (zero != Vector4.zero)
			{
				list.Add(new TemplateSelection(i, zero));
			}
		}
		if (list.Count == 0)
		{
			return null;
		}
		return new Group(this, list);
	}

	private Group CreateTypeGroup(EncounterTemplateType type)
	{
		List<TemplateSelection> list = new List<TemplateSelection>();
		for (int i = 0; i < baseTemplates.Length; i++)
		{
			if (baseTemplates[i].encounterType == type)
			{
				list.Add(new TemplateSelection(i));
			}
		}
		if (list.Count == 0)
		{
			return null;
		}
		return new Group(this, list);
	}

	private Group CreateGroupWithGuaranteedPickups(int minPickupCount, uint contentMask, EncounterTemplateType encounterType)
	{
		List<TemplateSelection> list = new List<TemplateSelection>();
		for (int i = 0; i < baseTemplates.Length; i++)
		{
			EncounterTemplate encounterTemplate = baseTemplates[i];
			if (encounterTemplate.encounterType != encounterType || EncounterUtils.CountGuaranteedPickupSlots(encounterTemplate) < minPickupCount)
			{
				continue;
			}
			if (contentMask == 0)
			{
				if (encounterTemplate.buildings.Length != 0 || encounterTemplate.pickups.Length > 1)
				{
					continue;
				}
			}
			else if (!EncounterUtils.CheckContentMask(encounterTemplate, contentMask))
			{
				continue;
			}
			list.Add(new TemplateSelection(i));
		}
		if (list.Count == 0)
		{
			return null;
		}
		return new Group(this, list);
	}

	private HashSet<Footprint> FootprintsForVariant(EncounterTemplate template)
	{
		HashSet<Footprint> hashSet = new HashSet<Footprint>();
		foreach (Vector2Int entrance in template.entrances)
		{
			hashSet.Add(new Footprint(template.width, template.height, entrance));
		}
		return hashSet;
	}
}
