using UnityEngine;

namespace Hex.MapGenerator;

public class ContentLocality
{
	public const int AreaPickups = 192;

	public const int AreaBuildings = 432;

	private const int RadiusPickups = 8;

	private const int RadiusBuildings = 12;

	private SlotLocality[] localities;

	public ContentLocality(ContentRegistry registry, Vector2Int mapSize)
	{
		localities = new SlotLocality[registry.SlotCount];
		for (int i = 0; i < registry.SlotCount; i++)
		{
			ContentSlot slot = registry.GetSlot(i);
			if (slot.IsFree())
			{
				int radius = ((slot.type == ContentSlotType.Building) ? 12 : 8);
				localities[i] = new SlotLocality(i, radius, registry, mapSize);
			}
		}
	}

	public SlotLocality ForSlot(int slot)
	{
		return localities[slot];
	}
}
