namespace Hex.MapGenerator;

public abstract class MetaObjectDesc
{
	public readonly string sid;

	public readonly string mapObjectSid;

	public readonly MetaObjectType type;

	public readonly int value;

	public readonly int guardValue;

	public readonly bool isBuilding;

	public MetaObjectDesc(string sid, string mapObjectSid, MetaObjectType type, int value, int guardValue, bool isBuilding)
	{
		this.sid = sid;
		this.mapObjectSid = mapObjectSid;
		this.type = type;
		this.value = value;
		this.guardValue = guardValue;
		this.isBuilding = isBuilding;
	}

	public abstract void AddProps(int id, MapObjectsRegistry registry, MapDescription mapDesc, int zoneID);
}
