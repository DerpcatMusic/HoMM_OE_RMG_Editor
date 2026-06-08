using System;
using System.Collections.Generic;

namespace Hex.MapGenerator;

public static class RuleParseUtils
{
	public static bool TryParseMainObjectIndex(out int mainObjectIndex, out string error, string[] args, int argIndex, int mainObjectCount)
	{
		mainObjectIndex = -1;
		error = null;
		if (args == null || argIndex >= args.Length)
		{
			error = "main object not specified";
			return false;
		}
		if (!int.TryParse(args[argIndex], out mainObjectIndex))
		{
			error = "can't parse main object index";
			mainObjectIndex = -1;
			return false;
		}
		if (mainObjectIndex < 0 || mainObjectIndex >= mainObjectCount)
		{
			error = "main object index is out of range";
			return false;
		}
		return true;
	}

	public static bool TryParseZoneIndex(out int zoneIndex, out string error, string[] args, int argIndex, RandomMapTemplate template, int variant)
	{
		zoneIndex = -1;
		error = null;
		if (args == null || argIndex >= args.Length)
		{
			error = "zone not specified";
			return false;
		}
		string zoneName = args[argIndex];
		zoneIndex = Array.FindIndex(template.variants[variant].zones, (RandomMapTemplate.Zone z) => z.name == zoneName);
		if (zoneIndex < 0)
		{
			error = "zone " + args[argIndex] + " doesn't exist";
			return false;
		}
		return true;
	}

	public static bool TryParseConnectionIndex(out int connectionIndex, out string error, string[] args, int argIndex, MapDescription mapDesc, int zoneID)
	{
		connectionIndex = -1;
		error = null;
		if (Utils.IsArrayNullOrEmpty(args))
		{
			error = "connection not specified";
			return false;
		}
		string connectionName = args[argIndex];
		connectionIndex = mapDesc.connections.FindIndex((MapDescription.Connection c) => c.name == connectionName);
		if (connectionIndex < 0)
		{
			error = "connection '" + connectionName + "' doesn't exist";
			return false;
		}
		if (mapDesc.connections[connectionIndex].connectionType == ConnectionType.Proximity)
		{
			error = "connection '" + connectionName + "' is a Proximity connection";
			return false;
		}
		MapDescription.Connection connection = mapDesc.connections[connectionIndex];
		if (connection.from != zoneID && connection.to != zoneID)
		{
			error = "connection '" + connectionName + "' is not connected to the zone.";
			return false;
		}
		return true;
	}

	public static bool TryParseMandatoryContentIndex(out int contentIndex, out string error, string[] args, int argIndex, List<MapDescription.MandatoryContent> mandatoryContent, int zoneID)
	{
		contentIndex = -1;
		error = null;
		if (Utils.IsArrayNullOrEmpty(args))
		{
			error = "content not specified";
			return false;
		}
		string contentName = args[argIndex];
		contentIndex = mandatoryContent.FindIndex((MapDescription.MandatoryContent c) => c.name == contentName);
		if (contentIndex < 0)
		{
			error = "content '" + contentName + "' doesn't exist";
			return false;
		}
		return true;
	}
}
