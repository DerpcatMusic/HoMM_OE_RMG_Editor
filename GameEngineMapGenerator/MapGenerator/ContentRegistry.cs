using System;
using System.Collections.Generic;

namespace Hex.MapGenerator;

public class ContentRegistry
{
	private EncountersInZone encounters;

	private List<ContentSlot> contentSlots;

	private int[] encounterBounds;

	private List<Content> contents;

	private Limits limits;

	private ContentLocality locality;

	public int SlotCount => contentSlots.Count;

	public EncountersInZone Encounters => encounters;

	public Limits Limits => limits;

	public ContentLocality Locality => locality;

	public ContentRegistry(int zoneIndex, MapDescription mapDesc, Layout layout, Random random)
	{
		Zone zone = layout.GetZone(zoneIndex);
		encounters = zone.encounters;
		limits = mapDesc.contentTask.limits[zoneIndex].Clone();
		contentSlots = new List<ContentSlot>(encounters.Count);
		encounterBounds = new int[encounters.Count + 1];
		contents = new List<Content>();
		List<int> list = new List<int>();
		List<int> list2 = new List<int>();
		for (int i = 0; i < encounters.Count; i++)
		{
			Encounter encounter = encounters[i];
			encounterBounds[i] = contentSlots.Count;
			for (int j = 0; j < encounter.template.buildings.Length; j++)
			{
				contentSlots.Add(ContentSlot.BuildingSlot(encounter, j));
			}
			list.Clear();
			list2.Clear();
			for (int k = 0; k < encounter.template.pickups.Length; k++)
			{
				if (encounter.template.pickups[k].isOptional)
				{
					list2.Add(k);
				}
				else
				{
					list.Add(k);
				}
			}
			int optionalPickups = encounter.optionalPickups;
			RngUtils.Shuffle(list2, random);
			for (int l = 0; l < optionalPickups; l++)
			{
				int item = list2[l];
				list.Add(item);
			}
			RngUtils.Shuffle(list, random);
			int resourcePickups = encounter.resourcePickups;
			for (int m = 0; m < list.Count; m++)
			{
				int pickupIndex = list[m];
				bool fillerResource = m < resourcePickups;
				contentSlots.Add(ContentSlot.PickupSlot(encounter, pickupIndex, fillerResource));
			}
			encounterBounds[i + 1] = contentSlots.Count;
		}
		list.Clear();
		for (int n = 0; n < encounters.AmbientPickupSlots.Count; n++)
		{
			list.Add(n);
		}
		RngUtils.Shuffle(list, random);
		for (int num = 0; num < list.Count; num++)
		{
			int index = list[num];
			contentSlots.Add(ContentSlot.AmbientPickupSlot(encounters.AmbientPickupSlots[index]));
		}
		locality = new ContentLocality(this, layout.Size);
	}

	public void AddContentToSlot(int slotIndex, Content content)
	{
		ContentSlot value = contentSlots[slotIndex];
		value.contentIndex = contents.Count;
		contentSlots[slotIndex] = value;
		contents.Add(content);
		if (content.NeedsToPlaceMapObject)
		{
			limits.AddContent(content.objectDesc);
		}
	}

	public ContentSlot GetSlot(int index)
	{
		return contentSlots[index];
	}

	public int BeginByEncounterType(EncounterType encounter)
	{
		int num = encounters.BeginByType(encounter);
		if (num == encounters.Count)
		{
			return SlotCount;
		}
		return encounterBounds[num];
	}

	public int EndByEncounterType(EncounterType encounter)
	{
		int num = encounters.EndByType(encounter) - 1;
		if (num < 0)
		{
			return 0;
		}
		return encounterBounds[num + 1];
	}

	public int BeginByEncounter(int encounterIndex)
	{
		return encounterBounds[encounterIndex];
	}

	public int EndByEncounter(int encounterIndex)
	{
		return encounterBounds[encounterIndex + 1];
	}

	public int BeginByEncounter(int encounterIndex, ContentSlotType slotType)
	{
		return slotType switch
		{
			ContentSlotType.Building => encounterBounds[encounterIndex], 
			ContentSlotType.Pickup => encounterBounds[encounterIndex] + encounters[encounterIndex].template.buildings.Length, 
			_ => -1, 
		};
	}

	public int EndByEncounter(int encounterIndex, ContentSlotType slotType)
	{
		return slotType switch
		{
			ContentSlotType.Building => encounterBounds[encounterIndex] + encounters[encounterIndex].template.buildings.Length, 
			ContentSlotType.Pickup => encounterBounds[encounterIndex + 1], 
			_ => -1, 
		};
	}

	public void FilterSlots(List<int> result, EncounterType? encounterType = null, ContentSlotType? slotType = null, bool? isFree = null, bool skipFillerResources = true)
	{
		int num = (encounterType.HasValue ? BeginByEncounterType(encounterType.Value) : 0);
		int num2 = (encounterType.HasValue ? EndByEncounterType(encounterType.Value) : SlotCount);
		for (int i = num; i < num2; i++)
		{
			ContentSlot contentSlot = contentSlots[i];
			if ((!slotType.HasValue || slotType.Value == contentSlot.type) && (!isFree.HasValue || isFree.Value == contentSlot.IsFree()) && (!skipFillerResources || !contentSlot.fillerResource))
			{
				result.Add(i);
			}
		}
	}

	public void GetAmbientPickupSlots(List<int> result, bool isFree)
	{
		for (int i = EndByEncounter(encounters.Count - 1); i < SlotCount; i++)
		{
			if (!isFree || contentSlots[i].IsFree())
			{
				result.Add(i);
			}
		}
	}

	public void GetFillerResourceSlots(List<int> result)
	{
		GetFillerResourceSlots(result, EncounterType.Guarded);
		GetFillerResourceSlots(result, EncounterType.Unguarded);
	}

	public void GetFillerResourceSlots(List<int> result, EncounterType encounterType)
	{
		int num = BeginByEncounterType(encounterType);
		int num2 = EndByEncounterType(encounterType);
		for (int i = num; i < num2; i++)
		{
			ContentSlot contentSlot = contentSlots[i];
			if (contentSlot.fillerResource && contentSlot.IsFree())
			{
				result.Add(i);
			}
		}
	}

	public Content GetContent(int contentIndex)
	{
		return contents[contentIndex];
	}

	public int EncounterGuardStrength(int encounterIndex)
	{
		int num = BeginByEncounter(encounterIndex);
		int num2 = EndByEncounter(encounterIndex);
		int num3 = 0;
		for (int i = num; i < num2; i++)
		{
			int contentIndex = contentSlots[i].contentIndex;
			if (contentIndex >= 0)
			{
				num3 += contents[contentIndex].guardValue;
			}
		}
		return num3;
	}
}
