namespace Hex.MapGenerator;

public class Zone
{
	public readonly MapDescription.Zone config;

	public readonly EncountersInZone encounters;

	public readonly int area;

	public readonly int crossroads;

	public Zone(MapDescription.Zone config, EncountersInZone encounters, PartitionData partition)
	{
		this.config = config;
		this.encounters = encounters;
		area = partition.area;
		crossroads = partition.crossroads;
	}
}
