namespace Hex.MapGenerator
{
	public enum ObstacleState : byte
	{
		Free = 0,
		Border = 1,
		Cliff = 2,
		Water = 3,
		Obstacle = 4,
		AlwaysFree = 5,
		AlwaysObstacle = 6,
		Reserved = 7,
		ReservedWalkable = 8,
		NoEncounters = 9,
		ReservedRoadTarget = 10
	}
}
