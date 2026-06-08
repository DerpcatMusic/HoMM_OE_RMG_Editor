using Hex.Logger2;

namespace Hex.MapGenerator;

public static class Log
{
	public struct Context
	{
		public int zoneIndex;

		public int connectionIndex;

		public MapDescription.Zone zone;

		public static Context none => new Context(-1, -1, null);

		public static Context Zone(MapDescription.Zone zone)
		{
			return new Context(-1, -1, zone);
		}

		public static Context ZoneIndex(int i)
		{
			return new Context(i, -1, null);
		}

		public static Context ConnIndex(int i)
		{
			return new Context(-1, i, null);
		}

		public Context(int zoneIndex, int connectionIndex, MapDescription.Zone zone)
		{
			this.zoneIndex = zoneIndex;
			this.connectionIndex = connectionIndex;
			this.zone = zone;
		}

		public MapDescription.Zone GetZone(MapDescription mapDesc)
		{
			if (zone != null)
			{
				return zone;
			}
			if (zoneIndex >= 0)
			{
				return mapDesc.zones[zoneIndex];
			}
			return null;
		}
	}

	public static void Error(string message)
	{
		HexLogger.Log(ELogType.Critical, ELogTag.MapGen, message);
	}

	public static void ConfigError(string message)
	{
		HexLogger.Log(ELogType.Config, ELogTag.MapGen, message);
	}

	public static void Message(string message)
	{
		HexLogger.Log(ELogType.Message, ELogTag.MapGen, message);
	}

	public static string FormatContext(string message, Context context, MapDescription mapDesc)
	{
		return message;
	}
}
