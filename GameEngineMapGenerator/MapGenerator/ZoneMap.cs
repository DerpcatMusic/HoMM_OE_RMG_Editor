namespace Hex.MapGenerator;

public class ZoneMap
{
	private byte[] zoneMap;

	private byte[] zoneMapPlayable;

	public int Length => zoneMap.Length;

	public byte? this[int tile] => GetPlayableZone(tile);

	public byte[] RawData => zoneMap;

	public byte[] RawDataPlayable => zoneMapPlayable;

	public ZoneMap(byte[] zoneMap)
	{
		this.zoneMap = zoneMap;
		zoneMapPlayable = Utils.CopyArray(zoneMap);
	}

	public void Set(int tile, byte zone)
	{
		zoneMapPlayable[tile] = zone;
		if (zone != byte.MaxValue)
		{
			zoneMap[tile] = zone;
		}
	}

	public byte GetZoneRaw(int tile)
	{
		return zoneMap[tile];
	}

	public byte GetPlayableZoneRaw(int tile)
	{
		return zoneMapPlayable[tile];
	}

	public byte? GetZone(int tile)
	{
		byte b = zoneMap[tile];
		if (b == byte.MaxValue)
		{
			return null;
		}
		return b;
	}

	public byte? GetPlayableZone(int tile)
	{
		byte b = zoneMapPlayable[tile];
		if (b == byte.MaxValue)
		{
			return null;
		}
		return b;
	}
}
