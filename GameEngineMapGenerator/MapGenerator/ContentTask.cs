using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class ContentTask
{
	public class SlottedContent
	{
		public struct ContentInfo
		{
			public bool isBuilding;

			public int size;

			public int width;

			public int height;

			public InteractionLayout interact;

			public int maskIndex;
		}

		private List<MapObjectDesc> descs;

		private bool[] hasSlot;

		private int[] typeCounts;

		private uint contentMask;

		private List<int> lookupOrder = new List<int>();

		private List<ContentInfo> contentInfos = new List<ContentInfo>();

		private int hoboPickups;

		private int ambientPickups;

		public int ContentCount => lookupOrder.Count;

		public int AmbientPickups => ambientPickups;

		public uint GetContentMask()
		{
			return contentMask;
		}

		public ContentInfo GetContentInfo(int index)
		{
			return contentInfos[lookupOrder[index]];
		}

		public bool HasSlot(int index)
		{
			return hasSlot[lookupOrder[index]];
		}

		public List<MapObjectDesc> GetObjectsWithSlots(bool isGuarded)
		{
			List<MapObjectDesc> list = new List<MapObjectDesc>();
			for (int i = 0; i < descs.Count; i++)
			{
				ContentInfo contentInfo = contentInfos[i];
				bool flag = hasSlot[i];
				if (contentInfo.isBuilding)
				{
					if (flag)
					{
						list.Add(descs[i]);
					}
				}
				else if (!isGuarded || flag)
				{
					list.Add(descs[i]);
				}
			}
			return list;
		}

		public SlottedContent(bool isGuarded, List<MapObjectDesc> descs, int hoboPickups)
		{
			this.descs = descs;
			hasSlot = new bool[descs.Count];
			typeCounts = new int[32];
			if (isGuarded)
			{
				this.hoboPickups = hoboPickups;
			}
			else
			{
				ambientPickups = hoboPickups;
			}
			foreach (MapObjectDesc desc in descs)
			{
				ContentInfo item = new ContentInfo
				{
					isBuilding = ContentDatabase.IsMapObjectBuilding(desc)
				};
				if (item.isBuilding)
				{
					item.width = desc.mapConfig.generatorConfig.buildingSizeX;
					item.height = desc.mapConfig.generatorConfig.buildingSizeZ;
					item.interact = desc.mapConfig.generatorConfig.buildingInteractionLayout;
					item.size = Mathf.Max(item.width, item.height);
					item.maskIndex = EncounterUtils.GetBuildingMaskIndex(item.width, item.height, item.interact);
				}
				else
				{
					item.maskIndex = EncounterUtils.GetPickupMaskIndex();
				}
				contentInfos.Add(item);
			}
			for (int i = 0; i < descs.Count; i++)
			{
				if (contentInfos[i].isBuilding || isGuarded)
				{
					lookupOrder.Add(i);
				}
				else
				{
					ambientPickups++;
				}
			}
			lookupOrder.Sort((int a, int b) => contentInfos[b].size.CompareTo(contentInfos[a].size));
			typeCounts[EncounterUtils.GetPickupMaskIndex()] = hoboPickups;
			foreach (int item2 in lookupOrder)
			{
				typeCounts[contentInfos[item2].maskIndex]++;
			}
			UpdateMask();
		}

		public int CountSlotless()
		{
			int num = 0;
			for (int i = 0; i < lookupOrder.Count; i++)
			{
				if (!hasSlot[lookupOrder[i]])
				{
					num++;
				}
			}
			return num;
		}

		private void UpdateMask()
		{
			contentMask = 0u;
			for (int i = 0; i < typeCounts.Length; i++)
			{
				if (typeCounts[i] > 0)
				{
					contentMask |= (uint)(1 << i);
				}
			}
		}

		public void FillEncounter(int start, Encounter encounter, MapObjectDesc mandatoryContent)
		{
			EncounterTemplate template = encounter.template;
			for (int i = 0; i < template.buildings.Length; i++)
			{
				if (IsSlotForMandatoryBuilding(i, encounter, mandatoryContent))
				{
					continue;
				}
				for (int j = start; j < lookupOrder.Count; j++)
				{
					int num = lookupOrder[j];
					if (!hasSlot[num])
					{
						ContentInfo contentInfo = contentInfos[num];
						if (!contentInfo.isBuilding)
						{
							break;
						}
						if (EncounterUtils.CanFitBuilding(template, i, contentInfo.width, contentInfo.height, contentInfo.interact))
						{
							hasSlot[num] = true;
							typeCounts[contentInfo.maskIndex]--;
							break;
						}
					}
				}
			}
			int num2 = EncounterUtils.CountGuaranteedPickupSlots(template);
			num2 += encounter.optionalPickups;
			num2 -= encounter.resourcePickups;
			for (int k = 0; k < num2; k++)
			{
				if (hoboPickups > 0)
				{
					hoboPickups--;
					typeCounts[EncounterUtils.GetPickupMaskIndex()]--;
					continue;
				}
				for (int l = start; l < lookupOrder.Count; l++)
				{
					int num3 = lookupOrder[l];
					if (!hasSlot[num3])
					{
						ContentInfo contentInfo2 = contentInfos[num3];
						if (!contentInfo2.isBuilding)
						{
							hasSlot[num3] = true;
							typeCounts[contentInfo2.maskIndex]--;
							break;
						}
					}
				}
			}
			UpdateMask();
		}

		private bool IsSlotForMandatoryBuilding(int slot, Encounter encounter, MapObjectDesc desc)
		{
			if (desc.IsNull)
			{
				return false;
			}
			if (!ContentDatabase.IsMapObjectBuilding(desc))
			{
				return false;
			}
			int buildingSizeX = desc.mapConfig.generatorConfig.buildingSizeX;
			int buildingSizeZ = desc.mapConfig.generatorConfig.buildingSizeZ;
			InteractionLayout buildingInteractionLayout = desc.mapConfig.generatorConfig.buildingInteractionLayout;
			return EncounterUtils.CanFitBuilding(encounter.template, slot, buildingSizeX, buildingSizeZ, buildingInteractionLayout);
		}
	}

	public List<MapObjectDesc>[] mandatory;

	public SlottedContent[] guarded;

	public SlottedContent[] unguarded;

	public List<MapObjectDesc>[] resources;

	public Limits[] limits;

	public static void Create(out ContentTask result, MapDescription mapDesc, System.Random random, GeneratorConfig generatorConfig, ZoneMap zoneMap, ReadOnlyArray<ObstacleState> obstaclesMap)
	{
		result = new ContentTask();
		ContentDatabase content = generatorConfig.GetContent();
		result.limits = CreateLimits(mapDesc, content);
		Limits[] array = new Limits[mapDesc.zones.Count];
		for (int i = 0; i < mapDesc.zones.Count; i++)
		{
			array[i] = result.limits[i].Clone();
		}
		result.mandatory = CreateMandatoryContent(mapDesc, array, content, random);
		result.guarded = new SlottedContent[mapDesc.zones.Count];
		result.unguarded = new SlottedContent[mapDesc.zones.Count];
		result.resources = new List<MapObjectDesc>[mapDesc.zones.Count];
		int[] array2 = GetPlayAreas(mapSize: new Vector2Int(mapDesc.sizeX, mapDesc.sizeZ), zoneCount: mapDesc.zones.Count, zoneMap: zoneMap, obstaclesMap: obstaclesMap);
		for (int j = 0; j < mapDesc.zones.Count; j++)
		{
			MapDescription.Zone zone = mapDesc.zones[j];
			byte contentBiome = zone.contentBiome;
			ValueOverrides valueOverrides = mapDesc.valueOverrides;
			Limits limits = array[j];
			int area = array2[j];
			List<MapObjectDesc> descs = CreateRandomContentByValue(GetTotalValue(zone.guardedContentValue, zone.guardedContentValuePerArea, area), zone.guardedContentPool, contentBiome, valueOverrides, limits, random);
			result.guarded[j] = new SlottedContent(isGuarded: true, descs, CountHoboPickups(j, isGuarded: true, mapDesc));
			List<MapObjectDesc> descs2 = CreateRandomContentByValue(GetTotalValue(zone.unguardedContentValue, zone.unguardedContentValuePerArea, area), zone.unguardedContentPool, contentBiome, valueOverrides, limits, random);
			result.unguarded[j] = new SlottedContent(isGuarded: false, descs2, CountHoboPickups(j, isGuarded: false, mapDesc));
			result.resources[j] = CreateRandomContentByValue(GetTotalValue(zone.resourcesValue, zone.resourcesValuePerArea, area), zone.resourcesContentPool, contentBiome, valueOverrides, limits, random);
		}
	}

	private static int[] GetPlayAreas(int zoneCount, ZoneMap zoneMap, ReadOnlyArray<ObstacleState> obstaclesMap, Vector2Int mapSize)
	{
		int length = zoneMap.Length;
		bool[] array = new bool[length];
		bool[] array2 = new bool[length];
		for (int i = 0; i < length; i++)
		{
			array[i] = obstaclesMap[i] == ObstacleState.AlwaysFree;
		}
		bool flag = false;
		for (int j = 0; j < 5; j++)
		{
			bool[] array3 = (flag ? array2 : array);
			bool[] array4 = (flag ? array : array2);
			for (int k = 0; k < length; k++)
			{
				if (array3[k])
				{
					array4[k] = true;
				}
				GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursCardinal(k, mapSize).GetEnumerator();
				while (enumerator.MoveNext())
				{
					int current = enumerator.Current;
					if (array3[current])
					{
						array4[k] = true;
					}
				}
			}
			flag = !flag;
		}
		bool[] array5 = (flag ? array2 : array);
		int[] array6 = new int[zoneCount];
		for (int l = 0; l < zoneCount; l++)
		{
			int num = 0;
			for (int m = 0; m < zoneMap.Length; m++)
			{
				if (array5[m] && obstaclesMap[m].IsFreeForEncounter())
				{
					byte? playableZone = zoneMap.GetPlayableZone(m);
					if (playableZone.HasValue && playableZone.Value == l)
					{
						num++;
					}
				}
			}
			array6[l] = num;
		}
		return array6;
	}

	private static int GetTotalValue(int flat, int perArea, int area)
	{
		return flat + Mathf.RoundToInt((float)(perArea * area) * 0.1f);
	}

	private static List<MapObjectDesc>[] CreateMandatoryContent(MapDescription mapDesc, Limits[] limitsByZone, ContentDatabase contentDatabase, System.Random random)
	{
		List<MapObjectDesc>[] array = new List<MapObjectDesc>[mapDesc.zones.Count];
		ContentWeightsTable contentWeightsTable = new ContentWeightsTable(contentDatabase, mapDesc.banInfo);
		List<ContentID> list = new List<ContentID>();
		HashSet<string> hashSet = new HashSet<string>();
		if (mapDesc.gameRules.heroHireBan)
		{
			GeneratorConfig.GetHeroHireBans(list, hashSet);
		}
		List<List<ContentID>> banLists = new List<List<ContentID>> { list };
		List<List<ContentWeight>> list2 = new List<List<ContentWeight>>();
		for (int i = 0; i < mapDesc.zones.Count; i++)
		{
			MapDescription.Zone zone = mapDesc.zones[i];
			Limits limits = limitsByZone[i];
			byte contentBiome = zone.contentBiome;
			int count = zone.mandatoryContent.Count;
			List<MapObjectDesc> list3 = (array[i] = new List<MapObjectDesc>());
			for (int j = 0; j < count; j++)
			{
				MapDescription.MandatoryContent mandatoryContent = zone.mandatoryContent[j];
				MapObjectDesc? mapObjectDesc = null;
				if (mandatoryContent.sid != null)
				{
					MapObjectDesc mapObjectDescRollSpecific = contentDatabase.GetMapObjectDescRollSpecific(mandatoryContent.sid, mandatoryContent.variant, random);
					if (!limits.IsLimitReached(mapObjectDescRollSpecific))
					{
						mapObjectDesc = mapObjectDescRollSpecific;
					}
				}
				else
				{
					contentWeightsTable.Clear();
					list2.Clear();
					list2.Add(mandatoryContent.content);
					contentWeightsTable.AddLists(list2, banLists, 1f);
					mapObjectDesc = contentWeightsTable.Roll(contentBiome, limits, random);
				}
				if (mapObjectDesc.HasValue && !hashSet.Contains(mapObjectDesc.Value.Sid))
				{
					MapObjectDesc value = mapObjectDesc.Value;
					list3.Add(value);
					limits.AddContent(value);
				}
				else
				{
					list3.Add(default(MapObjectDesc));
				}
			}
		}
		return array;
	}

	private static Limits[] CreateLimits(MapDescription mapDesc, ContentDatabase contentDatabase)
	{
		int num = 0;
		foreach (MapDescription.Zone zone in mapDesc.zones)
		{
			foreach (MapDescription.MainObject mainObject in zone.mainObjects)
			{
				if (mainObject.type == MainObjectType.Spawn)
				{
					num++;
				}
			}
		}
		int maxPrisonCount = (mapDesc.heroPoolCount - 12 * num) / mapDesc.zones.Count;
		Limits[] array = new Limits[mapDesc.zones.Count];
		for (int i = 0; i < mapDesc.zones.Count; i++)
		{
			byte contentBiome = mapDesc.zones[i].contentBiome;
			array[i] = new Limits(contentDatabase, mapDesc.zones[i].contentCountLimits, contentBiome, maxPrisonCount);
		}
		return array;
	}

	private static List<MapObjectDesc> CreateRandomContentByValue(int totalValue, ContentPool contentPool, byte biome, ValueOverrides valueOverrides, Limits limits, System.Random random)
	{
		List<MapObjectDesc> list = new List<MapObjectDesc>();
		float[] targetPercentages = contentPool.ValueDistribution.TargetPercentages;
		for (int num = targetPercentages.Length - 1; num >= 0; num--)
		{
			Vector2Int vector2Int = contentPool.ValueDistribution.Bracket(num);
			int num2 = Mathf.FloorToInt(targetPercentages[num] * (float)totalValue);
			int x = vector2Int.x;
			int num3 = 0;
			int num4 = 0;
			while (num4 < 1000000 && num3 + x <= num2)
			{
				num4++;
				int num5 = num2 - num3;
				if (vector2Int.y >= 0)
				{
					num5 = Mathf.Min(num5, vector2Int.y);
				}
				if (num5 < x)
				{
					num5 = x;
				}
				MapObjectDesc? content = contentPool.GetContent(biome, random, x, num5, limits);
				if (!content.HasValue)
				{
					break;
				}
				MapObjectDesc value = content.Value;
				limits?.AddContent(value);
				num3 += valueOverrides.GetValue(value);
				list.Add(value);
			}
		}
		return list;
	}

	private static List<MapObjectDesc> CreateRandomContentByCount(int totalCount, ContentPool contentPool, byte biome, Limits limits, System.Random random)
	{
		List<MapObjectDesc> list = new List<MapObjectDesc>();
		float[] targetPercentages = contentPool.ValueDistribution.TargetPercentages;
		for (int num = targetPercentages.Length - 1; num >= 0; num--)
		{
			Vector2Int vector2Int = contentPool.ValueDistribution.Bracket(num);
			int num2 = Mathf.CeilToInt(targetPercentages[num] * (float)totalCount);
			for (int i = 0; i < num2; i++)
			{
				MapObjectDesc? content = contentPool.GetContent(biome, random, vector2Int.x, vector2Int.y, limits);
				if (!content.HasValue)
				{
					break;
				}
				MapObjectDesc value = content.Value;
				limits?.AddContent(value);
				list.Add(value);
			}
		}
		return list;
	}

	private static int CountHoboPickups(int zoneID, bool isGuarded, MapDescription mapDesc)
	{
		List<MapObjectDesc> list = mapDesc.contentTask.mandatory[zoneID];
		List<MapDescription.MandatoryContent> mandatoryContent = mapDesc.zones[zoneID].mandatoryContent;
		int num = 0;
		for (int i = 0; i < list.Count; i++)
		{
			MapObjectDesc desc = list[i];
			if (!desc.IsNull && mandatoryContent[i].isGuarded == isGuarded && !ContentDatabase.IsMapObjectBuilding(desc))
			{
				bool flag = mandatoryContent[i].rules.Count > 0;
				bool designatedEncounter = mandatoryContent[i].designatedEncounter;
				bool soloEncounter = mandatoryContent[i].soloEncounter;
				if (!(designatedEncounter || soloEncounter || flag))
				{
					num++;
				}
			}
		}
		return num;
	}
}
