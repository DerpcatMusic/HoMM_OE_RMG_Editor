using System;
using System.Collections.Generic;
using Hex.Map;
using UnityEngine;

namespace Hex.MapGenerator;

public class ContentSlotsFiller
{
	private struct BuildingContent
	{
		public Content content;

		public PooledArray<int> suitableSlots;

		public BuildingContent(Content content, PooledArray<int> suitableSlots)
		{
			this.content = content;
			this.suitableSlots = suitableSlots;
		}
	}

	private System.Random random;

	private ValueOverrides valueOverrides;

	private MemoryPool<int> intPool = new MemoryPool<int>();

	private List<BuildingContent> buildings = new List<BuildingContent>();

	private List<Content> pickups = new List<Content>();

	private List<int> tempInts = new List<int>();

	private Dictionary<string, int> countBySid = new Dictionary<string, int>();

	private Dictionary<string, int> localCountBySid = new Dictionary<string, int>();

	private float limitCoeffPickups;

	private float limitCoeffBuildings;

	public ContentSlotsFiller(ValueOverrides valueOverrides, System.Random random)
	{
		this.valueOverrides = valueOverrides;
		this.random = random;
	}

	public void Fill(List<int> slots, byte biome, int zoneArea, List<MapObjectDesc> content, ContentPool contentPool, ContentRegistry contentRegistry)
	{
		intPool.Clear();
		buildings.Clear();
		pickups.Clear();
		countBySid.Clear();
		limitCoeffPickups = 192f / (float)zoneArea;
		limitCoeffBuildings = 432f / (float)zoneArea;
		int num = CreateContent(slots, content, contentPool, contentRegistry);
		num -= FillBuildings(slots, biome, contentPool, contentRegistry);
		num -= FillPickups(slots, contentRegistry);
		FillBuildingsFallback(slots, biome, contentPool, contentRegistry, num);
	}

	private int FillBuildings(List<int> slots, byte biome, ContentPool contentPool, ContentRegistry contentRegistry)
	{
		int num = 0;
		while (buildings.Count > 0)
		{
			(int, int) buildingWithFewestSlots = GetBuildingWithFewestSlots(contentRegistry);
			var (num2, _) = buildingWithFewestSlots;
			if (buildingWithFewestSlots.Item2 > 0)
			{
				int slotIndex = PickSlotForBuilding(num2, contentRegistry);
				Content content = buildings[num2].content;
				contentRegistry.AddContentToSlot(slotIndex, content);
				num += content.value;
			}
			buildings[num2] = buildings[buildings.Count - 1];
			buildings.RemoveAt(buildings.Count - 1);
		}
		return num;
	}

	private int FillPickups(List<int> slots, ContentRegistry contentRegistry)
	{
		int num = 0;
		foreach (int slot in slots)
		{
			if (contentRegistry.GetSlot(slot).type != ContentSlotType.Pickup)
			{
				continue;
			}
			SlotLocality slotLocality = contentRegistry.Locality.ForSlot(slot);
			localCountBySid.Clear();
			slotLocality.CountContentBySid(localCountBySid);
			if (pickups.Count == 0)
			{
				break;
			}
			int index = -1;
			int num2 = int.MaxValue;
			for (int i = 0; i < pickups.Count; i++)
			{
				Content content = pickups[i];
				localCountBySid.TryGetValue(content.objectDesc.Sid, out var value);
				int limit = GetLimit(content.objectDesc.Sid, isBuilding: false);
				if (value < limit)
				{
					index = i;
					break;
				}
				if (value < num2)
				{
					index = i;
					num2 = value;
				}
			}
			Content content2 = pickups[index];
			contentRegistry.AddContentToSlot(slot, content2);
			pickups[index] = pickups[pickups.Count - 1];
			pickups.RemoveAt(pickups.Count - 1);
			num += content2.value;
		}
		return num;
	}

	private void FillBuildingsFallback(List<int> slots, byte biome, ContentPool contentPool, ContentRegistry contentRegistry, int targetValue)
	{
		int num = 0;
		foreach (int slot3 in slots)
		{
			ContentSlot slot = contentRegistry.GetSlot(slot3);
			if (slot.IsFree() && slot.type == ContentSlotType.Building)
			{
				num++;
			}
		}
		if (num == 0)
		{
			return;
		}
		int targerValue = Mathf.Max(targetValue) / num;
		foreach (int slot4 in slots)
		{
			ContentSlot slot2 = contentRegistry.GetSlot(slot4);
			if (slot2.IsFree() && slot2.type == ContentSlotType.Building)
			{
				MapObjectDesc? mapObjectDesc = FindFallbackContent(slot2, biome, contentRegistry.Limits, contentPool, targerValue);
				if (mapObjectDesc.HasValue)
				{
					MapObjectDesc value = mapObjectDesc.Value;
					int value2 = valueOverrides.GetValue(value);
					int guardValue = valueOverrides.GetGuardValue(value);
					Content content = Content.ObjectFromPool(value, value2, guardValue, canBeMoved: true, contentPool);
					contentRegistry.AddContentToSlot(slot4, content);
				}
			}
		}
	}

	private int CreateContent(List<int> slots, List<MapObjectDesc> contentList, ContentPool contentPool, ContentRegistry contentRegistry)
	{
		int num = 0;
		foreach (MapObjectDesc content2 in contentList)
		{
			int value = valueOverrides.GetValue(content2);
			int guardValue = valueOverrides.GetGuardValue(content2);
			Content content = Content.ObjectFromPool(content2, value, guardValue, canBeMoved: true, contentPool);
			if (ContentDatabase.IsMapObjectBuilding(content2))
			{
				buildings.Add(new BuildingContent(content, GetSuitableSlotsForBuilding(slots, content2, contentRegistry)));
			}
			else
			{
				pickups.Add(content);
			}
			countBySid.TryGetValue(content2.Sid, out var value2);
			value2++;
			countBySid[content2.Sid] = value2;
			num += content.value;
		}
		return num;
	}

	private int PickSlotForBuilding(int buildingIndex, ContentRegistry contentRegistry)
	{
		BuildingContent buildingContent = buildings[buildingIndex];
		int limit = GetLimit(buildingContent.content.objectDesc.Sid, isBuilding: true);
		int result = -1;
		int num = int.MaxValue;
		for (int i = 0; i < buildingContent.suitableSlots.Length; i++)
		{
			int num2 = buildingContent.suitableSlots[i];
			if (contentRegistry.GetSlot(num2).IsFree())
			{
				int num3 = contentRegistry.Locality.ForSlot(num2).CountContentBySid(buildingContent.content.objectDesc.Sid);
				if (num3 < limit)
				{
					return num2;
				}
				if (num3 < num)
				{
					result = num2;
					num = num3;
				}
			}
		}
		return result;
	}

	private MapObjectDesc? FindFallbackContent(ContentSlot slot, byte biome, Limits limits, ContentPool contentPool, int targerValue)
	{
		Vector2Int[] brackets = contentPool.ValueDistribution.Brackets;
		for (int i = 0; i < brackets.Length; i++)
		{
			Vector2Int vector2Int = brackets[i];
			if (Utils.IsInValueBracket(targerValue, vector2Int.x, vector2Int.y))
			{
				MapObjectDesc? result = ((slot.type != ContentSlotType.Building) ? contentPool.GetPickup(biome, random, vector2Int.x, vector2Int.y, limits) : contentPool.GetBuilding(biome, slot.encounter.template, slot.buildingIndex, random, vector2Int.x, vector2Int.y, limits));
				if (result.HasValue)
				{
					return result;
				}
			}
		}
		if (slot.type == ContentSlotType.Building)
		{
			return contentPool.GetBuilding(biome, slot.encounter.template, slot.buildingIndex, random, -1, -1, limits);
		}
		return contentPool.GetPickup(biome, random, -1, -1, limits);
	}

	private (int, int) GetBuildingWithFewestSlots(ContentRegistry contentRegistry)
	{
		int num = int.MaxValue;
		int item = -1;
		for (int i = 0; i < buildings.Count; i++)
		{
			PooledArray<int> suitableSlots = buildings[i].suitableSlots;
			int num2 = 0;
			for (int j = 0; j < suitableSlots.Length; j++)
			{
				if (contentRegistry.GetSlot(suitableSlots[j]).IsFree())
				{
					num2++;
				}
			}
			if (num2 < num)
			{
				item = i;
				num = num2;
			}
		}
		return (item, num);
	}

	private PooledArray<int> GetSuitableSlotsForBuilding(List<int> slots, MapObjectDesc desc, ContentRegistry contentRegistry)
	{
		List<int> list = tempInts;
		list.Clear();
		GeneratorObjectConfig generatorConfig = desc.mapConfig.generatorConfig;
		foreach (int slot2 in slots)
		{
			ContentSlot slot = contentRegistry.GetSlot(slot2);
			if (slot.type == ContentSlotType.Building && EncounterUtils.CanFitBuilding(slot.encounter.template, slot.buildingIndex, generatorConfig.buildingSizeX, generatorConfig.buildingSizeZ, generatorConfig.buildingInteractionLayout))
			{
				list.Add(slot2);
			}
		}
		PooledArray<int> result = intPool.Allocate(list.Count, 0);
		for (int i = 0; i < list.Count; i++)
		{
			result[i] = list[i];
		}
		return result;
	}

	private int GetLimit(string sid, bool isBuilding)
	{
		return Mathf.Max(Mathf.RoundToInt((isBuilding ? limitCoeffBuildings : limitCoeffPickups) * (float)countBySid[sid]), 1);
	}
}
