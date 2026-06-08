using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class SlotLocality
{
	private ContentRegistry registry;

	private List<int> slots = new List<int>();

	public SlotLocality(int slotIndex, int radius, ContentRegistry registry, Vector2Int mapSize)
	{
		this.registry = registry;
		ContentSlot slot = registry.GetSlot(slotIndex);
		Vector2Int vector2Int = GridUtils.IndexToCoords(slot.GetPosition(mapSize), mapSize);
		int num = radius * radius;
		for (int i = 0; i < registry.SlotCount; i++)
		{
			if (i != slotIndex)
			{
				ContentSlot slot2 = registry.GetSlot(i);
				if (slot2.type == slot.type && (GridUtils.IndexToCoords(slot2.GetPosition(mapSize), mapSize) - vector2Int).sqrMagnitude <= num)
				{
					slots.Add(i);
				}
			}
		}
	}

	public void CountContentBySid(Dictionary<string, int> result)
	{
		foreach (int slot2 in slots)
		{
			ContentSlot slot = registry.GetSlot(slot2);
			if (!slot.IsFree())
			{
				Content content = registry.GetContent(slot.contentIndex);
				if (content.NeedsToPlaceMapObject)
				{
					int value = 0;
					result.TryGetValue(content.objectDesc.Sid, out value);
					result[content.objectDesc.Sid] = value + 1;
				}
			}
		}
	}

	public int CountContentBySid(string sid)
	{
		int num = 0;
		foreach (int slot2 in slots)
		{
			ContentSlot slot = registry.GetSlot(slot2);
			if (!slot.IsFree())
			{
				Content content = registry.GetContent(slot.contentIndex);
				if (content.NeedsToPlaceMapObject && content.objectDesc.Sid == sid)
				{
					num++;
				}
			}
		}
		return num;
	}
}
