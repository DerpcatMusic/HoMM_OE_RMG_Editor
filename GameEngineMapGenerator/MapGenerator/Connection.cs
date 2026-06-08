namespace Hex.MapGenerator;

public class Connection
{
	public readonly MapDescription.Connection config;

	public readonly int zoneFrom;

	public readonly int zoneTo;

	public readonly ConnectionType type;

	public readonly int guardPosition;

	public Connection(MapDescription.Connection config, int zoneFrom, int zoneTo, ConnectionType type, int guardPosition)
	{
		this.config = config;
		this.zoneFrom = zoneFrom;
		this.zoneTo = zoneTo;
		this.type = type;
		this.guardPosition = guardPosition;
	}
}
