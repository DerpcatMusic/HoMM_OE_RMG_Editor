using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public static class EncounterUtils
{
	private const int MaxTemplateSize = 7;

	private const int MaxBuildingSize = 4;

	private static Pathfinder<int> pathfinder;

	private static EncounterNeighboursGetter neighboursGetter;

	private static EncounterCostCalculator costCalculator;

	private static List<Vector2Int> tempVectors = new List<Vector2Int>();

	private static List<int> tempInts = new List<int>();

	private static List<BuildingKey> MaskBuildingKeys;

	public static Pathfinder<int> GetPathfinder(EncounterTemplate encounter)
	{
		if (pathfinder == null)
		{
			neighboursGetter = new EncounterNeighboursGetter();
			costCalculator = new EncounterCostCalculator();
			pathfinder = new Pathfinder<int>(49, neighboursGetter, costCalculator);
		}
		neighboursGetter.SetEncounter(encounter);
		costCalculator.SetEncounter(encounter);
		return pathfinder;
	}

	public static EncounterTemplate GetMirroredByX(this EncounterTemplate encounter)
	{
		EncounterTemplate encounterTemplate = new EncounterTemplate();
		encounterTemplate.name = encounter.name;
		encounterTemplate.encounterType = encounter.encounterType;
		encounterTemplate.allowMirrorX = encounter.allowMirrorX;
		encounterTemplate.allowMirrorY = encounter.allowMirrorY;
		encounterTemplate.width = encounter.width;
		encounterTemplate.height = encounter.height;
		encounterTemplate.roadTargetType = encounter.roadTargetType;
		encounterTemplate.roadTarget = MirrorPositionX(encounter.roadTarget, encounter.width);
		encounterTemplate.entrances = new List<Vector2Int>();
		for (int i = 0; i < encounter.entrances.Count; i++)
		{
			encounterTemplate.entrances.Add(MirrorPositionX(encounter.entrances[i], encounter.width));
		}
		encounterTemplate.holeTiles = new List<Vector2Int>();
		for (int j = 0; j < encounter.holeTiles.Count; j++)
		{
			encounterTemplate.holeTiles.Add(MirrorPositionX(encounter.holeTiles[j], encounter.height));
		}
		encounterTemplate.guards = new GuardSlot[encounter.guards.Length];
		for (int k = 0; k < encounter.guards.Length; k++)
		{
			GuardSlot guardSlot = encounter.guards[k];
			encounterTemplate.guards[k].position = MirrorPositionX(guardSlot.position, encounter.width);
		}
		encounterTemplate.pickups = new PickupSlot[encounter.pickups.Length];
		for (int l = 0; l < encounter.pickups.Length; l++)
		{
			PickupSlot pickupSlot = encounter.pickups[l];
			encounterTemplate.pickups[l].position = MirrorPositionX(pickupSlot.position, encounter.width);
		}
		encounterTemplate.tileContents = new EncounterTemplate.TileContent[encounter.tileContents.Length];
		for (int m = 0; m < encounter.tileContents.Length; m++)
		{
			Vector2Int position = new Vector2Int(m % encounter.width, m / encounter.width);
			position = MirrorPositionX(position, encounter.width);
			int num = position.x + position.y * encounter.width;
			encounterTemplate.tileContents[num] = encounter.tileContents[m];
		}
		encounterTemplate.buildings = new BuildingSlot[encounter.buildings.Length];
		for (int n = 0; n < encounter.buildings.Length; n++)
		{
			BuildingSlot buildingSlot = encounter.buildings[n];
			BuildingSlot buildingSlot2 = buildingSlot;
			buildingSlot2.position = MirrorPositionX(buildingSlot.position + Vector2Int.right * (buildingSlot.width - 1), encounter.width);
			if (buildingSlot.interaction == InteractionLayout.CornerLeft)
			{
				buildingSlot2.interaction = InteractionLayout.CornerRight;
			}
			if (buildingSlot.interaction == InteractionLayout.CornerRight)
			{
				buildingSlot2.interaction = InteractionLayout.CornerLeft;
			}
			encounterTemplate.buildings[n] = buildingSlot2;
		}
		return encounterTemplate;
	}

	public static EncounterTemplate GetMirroredByY(this EncounterTemplate encounter)
	{
		EncounterTemplate encounterTemplate = new EncounterTemplate();
		encounterTemplate.name = encounter.name;
		encounterTemplate.encounterType = encounter.encounterType;
		encounterTemplate.allowMirrorX = encounter.allowMirrorX;
		encounterTemplate.allowMirrorY = encounter.allowMirrorY;
		encounterTemplate.width = encounter.width;
		encounterTemplate.height = encounter.height;
		encounterTemplate.roadTarget = MirrorPositionY(encounter.roadTarget, encounter.height);
		encounterTemplate.entrances = new List<Vector2Int>();
		for (int i = 0; i < encounter.entrances.Count; i++)
		{
			encounterTemplate.entrances.Add(MirrorPositionY(encounter.entrances[i], encounter.height));
		}
		encounterTemplate.holeTiles = new List<Vector2Int>();
		for (int j = 0; j < encounter.holeTiles.Count; j++)
		{
			encounterTemplate.holeTiles.Add(MirrorPositionY(encounter.holeTiles[j], encounter.height));
		}
		encounterTemplate.guards = new GuardSlot[encounter.guards.Length];
		for (int k = 0; k < encounter.guards.Length; k++)
		{
			GuardSlot guardSlot = encounter.guards[k];
			encounterTemplate.guards[k].position = MirrorPositionY(guardSlot.position, encounter.height);
		}
		encounterTemplate.pickups = new PickupSlot[encounter.pickups.Length];
		for (int l = 0; l < encounter.pickups.Length; l++)
		{
			PickupSlot pickupSlot = encounter.pickups[l];
			encounterTemplate.pickups[l].position = MirrorPositionY(pickupSlot.position, encounter.height);
		}
		encounterTemplate.tileContents = new EncounterTemplate.TileContent[encounter.tileContents.Length];
		for (int m = 0; m < encounter.tileContents.Length; m++)
		{
			Vector2Int position = new Vector2Int(m % encounter.width, m / encounter.width);
			position = MirrorPositionY(position, encounter.height);
			int num = position.x + position.y * encounter.width;
			encounterTemplate.tileContents[num] = encounter.tileContents[m];
		}
		encounterTemplate.buildings = new BuildingSlot[encounter.buildings.Length];
		for (int n = 0; n < encounter.buildings.Length; n++)
		{
			BuildingSlot buildingSlot = encounter.buildings[n];
			BuildingSlot buildingSlot2 = buildingSlot;
			buildingSlot2.position = MirrorPositionY(buildingSlot.position + Vector2Int.up * (buildingSlot.height - 1), encounter.height);
			encounterTemplate.buildings[n] = buildingSlot2;
		}
		return encounterTemplate;
	}

	public static Vector2Int MirrorPositionX(Vector2Int position, int width)
	{
		position.x = width - position.x - 1;
		return position;
	}

	public static Vector2Int MirrorPositionY(Vector2Int position, int height)
	{
		position.y = height - position.y - 1;
		return position;
	}

	public static bool CanFitBuilding(EncounterTemplate encounter, int slotIndex, int width, int height, InteractionLayout interaction)
	{
		BuildingSlot buildingSlot = encounter.buildings[slotIndex];
		CheckKeyInteractTiles(out var left, out var right, encounter, slotIndex, interaction);
		return CanFitBuilding(buildingSlot.width, buildingSlot.height, buildingSlot.interaction, width, height, interaction, left, right);
	}

	public static bool CanFitBuilding(int slotWidth, int slotHeight, InteractionLayout slotInteraction, int width, int height, InteractionLayout interaction, bool interactLeftFree, bool interactRightFree)
	{
		if (slotWidth < width)
		{
			return false;
		}
		if (slotHeight < height)
		{
			return false;
		}
		if (slotInteraction == InteractionLayout.CornerRight)
		{
			switch (interaction)
			{
			case InteractionLayout.CornerRight:
				return true;
			case InteractionLayout.CornerLeft:
				return true;
			case InteractionLayout.Bottom:
				return false;
			case InteractionLayout.All:
				return false;
			}
		}
		if (slotInteraction == InteractionLayout.CornerLeft)
		{
			switch (interaction)
			{
			case InteractionLayout.CornerRight:
				return true;
			case InteractionLayout.CornerLeft:
				return true;
			case InteractionLayout.Bottom:
				return false;
			case InteractionLayout.All:
				return false;
			}
		}
		if (slotInteraction == InteractionLayout.Bottom)
		{
			switch (interaction)
			{
			case InteractionLayout.CornerRight:
				return true;
			case InteractionLayout.CornerLeft:
				return true;
			case InteractionLayout.Bottom:
				return true;
			case InteractionLayout.All:
				return false;
			}
		}
		if (slotInteraction == InteractionLayout.All)
		{
			switch (interaction)
			{
			case InteractionLayout.CornerRight:
				return interactLeftFree || interactRightFree;
			case InteractionLayout.CornerLeft:
				return interactLeftFree || interactRightFree;
			case InteractionLayout.Bottom:
				return interactLeftFree || interactRightFree;
			case InteractionLayout.All:
				return true;
			}
		}
		return false;
	}

	public static bool TryFitBuilding(out Vector2Int position, out bool flip, EncounterTemplate encounter, int slotIndex, int width, int height, InteractionLayout interaction)
	{
		BuildingSlot buildingSlot = encounter.buildings[slotIndex];
		position = Vector2Int.zero;
		flip = false;
		if (buildingSlot.width < width)
		{
			return false;
		}
		if (buildingSlot.height < height)
		{
			return false;
		}
		CheckKeyInteractTiles(out var left, out var right, encounter, slotIndex, interaction);
		Vector2Int position2 = buildingSlot.position;
		Vector2Int vector2Int = buildingSlot.position + Vector2Int.right * (buildingSlot.width - width);
		if (buildingSlot.interaction == InteractionLayout.CornerRight)
		{
			switch (interaction)
			{
			case InteractionLayout.CornerRight:
				position = vector2Int;
				flip = false;
				return true;
			case InteractionLayout.CornerLeft:
				position = vector2Int;
				flip = true;
				return true;
			case InteractionLayout.Bottom:
				return false;
			case InteractionLayout.All:
				return false;
			}
		}
		if (buildingSlot.interaction == InteractionLayout.CornerLeft)
		{
			switch (interaction)
			{
			case InteractionLayout.CornerRight:
				position = position2;
				flip = true;
				return true;
			case InteractionLayout.CornerLeft:
				position = position2;
				flip = false;
				return true;
			case InteractionLayout.Bottom:
				return false;
			case InteractionLayout.All:
				return false;
			}
		}
		if (buildingSlot.interaction == InteractionLayout.Bottom || buildingSlot.interaction == InteractionLayout.All)
		{
			switch (interaction)
			{
			case InteractionLayout.CornerRight:
				if (right)
				{
					position = vector2Int;
					flip = false;
					return true;
				}
				if (left)
				{
					position = position2;
					flip = true;
					return true;
				}
				return false;
			case InteractionLayout.CornerLeft:
				if (right)
				{
					position = vector2Int;
					flip = true;
					return true;
				}
				if (left)
				{
					position = position2;
					flip = false;
					return true;
				}
				return false;
			case InteractionLayout.Bottom:
				if (right)
				{
					position = vector2Int;
					flip = false;
					return true;
				}
				if (left)
				{
					position = position2;
					flip = false;
					return true;
				}
				return false;
			}
		}
		if (buildingSlot.interaction == InteractionLayout.Bottom && interaction == InteractionLayout.All)
		{
			return false;
		}
		List<Vector2Int> list = tempVectors;
		list.Clear();
		GetInteractionTiles(width, height, InteractionLayout.All, Vector2Int.zero, list);
		for (int num = buildingSlot.position.x + buildingSlot.width - width; num >= buildingSlot.position.x; num--)
		{
			for (int num2 = buildingSlot.position.y + buildingSlot.height - height; num2 >= buildingSlot.position.y; num2--)
			{
				foreach (Vector2Int item in list)
				{
					position = new Vector2Int(num, num2);
					if (CanBeInteractTile(encounter, position + item, encounter.guards.Length == 0))
					{
						return true;
					}
				}
			}
		}
		return false;
	}

	public static void SetObstaclesByTemplate(ObstacleState[] obstacles, int position, int entrance, EncounterTemplate template, Vector2Int mapSize)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(position, mapSize);
		bool flag = false;
		flag |= template.encounterType == EncounterTemplateType.City;
		flag |= template.encounterType == EncounterTemplateType.GladiatorArena;
		for (int i = 0; i < template.width; i++)
		{
			for (int j = 0; j < template.height; j++)
			{
				int num = i + j * template.width;
				int num2 = GridUtils.CoordsToIndex(vector2Int + new Vector2Int(i, j), mapSize);
				bool flag2;
				switch (template.tileContents[num])
				{
				case EncounterTemplate.TileContent.Free:
					flag2 = true;
					obstacles[num2] = ObstacleState.ReservedWalkable;
					break;
				case EncounterTemplate.TileContent.Obstacle:
					flag2 = false;
					obstacles[num2] = ObstacleState.AlwaysObstacle;
					break;
				case EncounterTemplate.TileContent.MaybeObstacle:
					flag2 = true;
					if (flag)
					{
						obstacles[num2] = ObstacleState.NoEncounters;
					}
					break;
				case EncounterTemplate.TileContent.Building:
					flag2 = false;
					obstacles[num2] = ObstacleState.Reserved;
					break;
				case EncounterTemplate.TileContent.Guard:
				{
					flag2 = true;
					obstacles[num2] = ObstacleState.ReservedWalkable;
					GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(num2, mapSize).GetEnumerator();
					while (enumerator.MoveNext())
					{
						int current = enumerator.Current;
						if (obstacles[current] == ObstacleState.Free)
						{
							obstacles[current] = ObstacleState.ReservedWalkable;
						}
					}
					break;
				}
				case EncounterTemplate.TileContent.Pickup:
					flag2 = true;
					obstacles[num2] = ObstacleState.ReservedWalkable;
					break;
				default:
					flag2 = false;
					obstacles[num2] = ObstacleState.Reserved;
					break;
				}
				if (flag2)
				{
					continue;
				}
				for (int k = 0; k < 4; k++)
				{
					int index = Direction.Clockwise(k);
					Vector2Int vector2Int2 = Direction.FromIndex(k);
					Vector2Int vector2Int3 = Direction.FromIndex(index);
					int neighbour = GridUtils.GetNeighbour(vector2Int2, num2, mapSize);
					int neighbour2 = GridUtils.GetNeighbour(vector2Int3, num2, mapSize);
					if (neighbour >= 0 && neighbour2 >= 0 && obstacles[neighbour] == ObstacleState.AlwaysFree && obstacles[neighbour2] == ObstacleState.AlwaysFree)
					{
						int neighbour3 = GridUtils.GetNeighbour(vector2Int2 + vector2Int3, num2, mapSize);
						obstacles[neighbour3] = ObstacleState.ReservedWalkable;
					}
				}
			}
		}
		Vector2Int vector2Int4 = GridUtils.IndexToCoords(position, mapSize);
		Vector2Int entrance2 = GridUtils.IndexToCoords(entrance, mapSize) - vector2Int4;
		int num3 = GridUtils.CoordsToIndex(vector2Int4 + EntranceNeighbour(entrance2, template.width, template.height), mapSize);
		obstacles[num3] = ObstacleState.ReservedWalkable;
		if (template.roadTargetType == EncounterTemplate.RoadTargetType.Coord)
		{
			int num4 = GridUtils.CoordsToIndex(vector2Int4 + template.roadTarget, mapSize);
			if (obstacles[num4] == ObstacleState.Reserved)
			{
				obstacles[num4] = ObstacleState.ReservedRoadTarget;
			}
		}
	}

	public static int CountGuaranteedPickupSlots(EncounterTemplate encounter)
	{
		int num = 0;
		PickupSlot[] pickups = encounter.pickups;
		for (int i = 0; i < pickups.Length; i++)
		{
			if (!pickups[i].isOptional)
			{
				num++;
			}
		}
		return num;
	}

	public static (int, int) CountPickupSlots(EncounterTemplate encounter)
	{
		int num = 0;
		int num2 = 0;
		PickupSlot[] pickups = encounter.pickups;
		for (int i = 0; i < pickups.Length; i++)
		{
			if (pickups[i].isOptional)
			{
				num++;
			}
			else
			{
				num2++;
			}
		}
		return (num2, num);
	}

	public static bool Validate(EncounterTemplate encounter, List<string> errorsList = null)
	{
		bool flag = encounter.guards.Length != 0;
		bool flag2 = !flag;
		encounter.relativeFrequency = Mathf.Max(1f, encounter.relativeFrequency);
		encounter.width = Mathf.Clamp(encounter.width, (!flag) ? 1 : 3, 7);
		encounter.height = Mathf.Clamp(encounter.height, (!flag) ? 1 : 3, 7);
		if (!CanBeMirroredByY(encounter))
		{
			encounter.allowMirrorY = false;
		}
		for (int i = 0; i < encounter.guards.Length; i++)
		{
			GuardSlot guardSlot = encounter.guards[i];
			guardSlot.position = new Vector2Int(Mathf.Clamp(guardSlot.position.x, 1, encounter.width - 2), Mathf.Clamp(guardSlot.position.y, 1, encounter.height - 2));
			encounter.guards[i] = guardSlot;
		}
		ClearTileContents(encounter);
		bool flag3 = true;
		errorsList?.Clear();
		List<Vector2Int> list = tempVectors;
		for (int j = 0; j < encounter.buildings.Length; j++)
		{
			BuildingSlot building = encounter.buildings[j];
			encounter.buildings[j].width = Mathf.Clamp(building.width, 1, 4);
			encounter.buildings[j].height = Mathf.Clamp(building.height, 1, 4);
			list.Clear();
			GetInteractionTiles(building.width, building.height, building.interaction, Vector2Int.zero, list);
			ValidateBuilding(encounter, building, !flag2, list, out var outOfBounds, out var overlap);
			if (outOfBounds)
			{
				flag3 = false;
				errorsList?.Add($"Building {j}: Out of bounds!");
			}
			if (overlap)
			{
				flag3 = false;
				errorsList?.Add($"Building {j}: Overlaps another building!");
			}
			if (flag3 && !ValidateInteractTiles(encounter, j, list, flag2))
			{
				errorsList?.Add($"Building {j}: All guaranteed interact tiles blocked!");
				flag3 = false;
			}
		}
		bool flag4 = false;
		int num = 0;
		List<int> list2 = tempInts;
		list2.Clear();
		list.Clear();
		GetAllBuildingsInteracts(list, encounter);
		for (int k = 0; k < encounter.entrances.Count; k++)
		{
			Vector2Int vector2Int = encounter.entrances[k];
			if (!IsValidEntrancePosition(vector2Int, encounter.width, encounter.height))
			{
				list2.Add(k);
				continue;
			}
			if (IsEntranceFree(encounter, vector2Int, flag2, list))
			{
				num++;
				continue;
			}
			flag3 = false;
			flag4 = true;
		}
		if (flag4)
		{
			flag3 = false;
			errorsList?.Add("Entrance blocked!");
		}
		if (num == 0)
		{
			flag3 = false;
			errorsList?.Add("No valid entrances!");
		}
		for (int num2 = list2.Count - 1; num2 >= 0; num2--)
		{
			encounter.entrances.RemoveAt(list2[num2]);
		}
		for (int l = 0; l < encounter.guards.Length; l++)
		{
			GuardSlot guardSlot2 = encounter.guards[l];
			if (GetTileContent(encounter, guardSlot2.position) >= EncounterTemplate.TileContent.Building)
			{
				flag3 = false;
				errorsList?.Add($"Guard {l}: Blocked by a building or another guard!");
			}
			else
			{
				SetTileContent(encounter, guardSlot2.position, EncounterTemplate.TileContent.Guard);
			}
		}
		for (int m = 0; m < encounter.pickups.Length; m++)
		{
			PickupSlot pickupSlot = encounter.pickups[m];
			if (pickupSlot.isOptional)
			{
				encounter.pickups[m].canBeHole = false;
			}
			if (!IsWithinBorders(pickupSlot.position, encounter.width, encounter.height))
			{
				flag3 = false;
				errorsList?.Add($"Pickup {m}: Out of bounds!.");
				break;
			}
			if (GetTileContent(encounter, pickupSlot.position) >= EncounterTemplate.TileContent.Building)
			{
				flag3 = false;
				errorsList?.Add($"Pickup {m}: Blocked by the guard or a building!");
			}
			else
			{
				SetTileContent(encounter, pickupSlot.position, EncounterTemplate.TileContent.Pickup);
			}
		}
		List<int> list3 = tempInts;
		list3.Clear();
		for (int n = 0; n < encounter.holeTiles.Count; n++)
		{
			if (!IsValidHoleTile(encounter, encounter.holeTiles[n]))
			{
				list3.Add(n);
			}
		}
		for (int num3 = list3.Count - 1; num3 >= 0; num3--)
		{
			encounter.holeTiles.RemoveAt(list3[num3]);
		}
		if (encounter.encounterType != EncounterTemplateType.City && encounter.roadTargetType == EncounterTemplate.RoadTargetType.Coord && !IsValidRoadTarget(encounter, encounter.roadTarget))
		{
			flag3 = false;
			errorsList?.Add("Invalid road target!");
		}
		return flag3;
	}

	private static void ClearTileContents(EncounterTemplate encounter)
	{
		int num = encounter.width * encounter.height;
		if (encounter.tileContents == null)
		{
			encounter.tileContents = new EncounterTemplate.TileContent[num];
		}
		else if (encounter.tileContents.Length != num)
		{
			EncounterTemplate.TileContent[] array = new EncounterTemplate.TileContent[num];
			for (int i = 0; i < Mathf.Min(num, encounter.tileContents.Length); i++)
			{
				array[i] = encounter.tileContents[i];
			}
			encounter.tileContents = array;
		}
		for (int j = 0; j < encounter.tileContents.Length; j++)
		{
			if (encounter.tileContents[j] > EncounterTemplate.TileContent.MaybeObstacle)
			{
				encounter.tileContents[j] = EncounterTemplate.TileContent.Free;
			}
		}
	}

	public static Vector2Int MountOffset(Encounter encounter, Vector2Int mapSize)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, mapSize);
		return GridUtils.IndexToCoords(encounter.entrance, mapSize) - vector2Int;
	}

	public static Vector2Int EntranceDirection(Vector2Int entrance, int width, int height)
	{
		Vector2Int zero = Vector2Int.zero;
		if (entrance.x == -1)
		{
			return Vector2Int.right;
		}
		if (entrance.x == width)
		{
			return Vector2Int.left;
		}
		if (entrance.y == -1)
		{
			return Vector2Int.up;
		}
		if (entrance.y == height)
		{
			return Vector2Int.down;
		}
		return zero;
	}

	public static Vector2Int EntranceNeighbour(Vector2Int entrance, int width, int height)
	{
		return entrance + EntranceDirection(entrance, width, height);
	}

	public static Vector2Int CityEntrance(Vector2Int buildingPosition, bool flip)
	{
		if (flip)
		{
			return buildingPosition + Vector2Int.down + Vector2Int.right * 2;
		}
		return buildingPosition + Vector2Int.down;
	}

	public static bool IsEntranceFree(EncounterTemplate encounter, Vector2Int entrance, bool allowOutOfBounds, List<Vector2Int> allBuildingInteracts)
	{
		if (allowOutOfBounds && allBuildingInteracts != null && allBuildingInteracts.Contains(entrance))
		{
			return true;
		}
		Vector2Int pos = EntranceNeighbour(entrance, encounter.width, encounter.height);
		EncounterTemplate.TileContent tileContent = GetTileContent(encounter, pos);
		if (tileContent != EncounterTemplate.TileContent.Building)
		{
			return tileContent != EncounterTemplate.TileContent.Obstacle;
		}
		return false;
	}

	private static void ValidateBuilding(EncounterTemplate encounter, BuildingSlot building, bool checkInteractTiles, List<Vector2Int> interactTiles, out bool outOfBounds, out bool overlap)
	{
		outOfBounds = false;
		overlap = false;
		for (int i = building.position.x; i < building.position.x + building.width; i++)
		{
			for (int j = building.position.y; j < building.position.y + building.height; j++)
			{
				if (!IsWithinBorders(new Vector2Int(i, j), encounter.width, encounter.height))
				{
					outOfBounds = true;
				}
				else if (GetTileContent(encounter, i, j) >= EncounterTemplate.TileContent.Building)
				{
					overlap = true;
				}
				else
				{
					SetTileContent(encounter, i, j, EncounterTemplate.TileContent.Building);
				}
			}
		}
		if (!checkInteractTiles)
		{
			return;
		}
		foreach (Vector2Int interactTile in interactTiles)
		{
			if (!IsWithinBorders(interactTile + building.position, encounter.width, encounter.height))
			{
				outOfBounds = true;
			}
		}
	}

	private static bool ValidateInteractTiles(EncounterTemplate encounter, int buildingIndex, List<Vector2Int> interactTiles, bool allowOutOfBounds)
	{
		BuildingSlot buildingSlot = encounter.buildings[buildingIndex];
		if (buildingSlot.interaction == InteractionLayout.CornerRight && !CanBeInteractTile(encounter, buildingSlot.BottomInteractionTileRight(), allowOutOfBounds))
		{
			return false;
		}
		if (buildingSlot.interaction == InteractionLayout.CornerLeft && !CanBeInteractTile(encounter, buildingSlot.BottomInteractionTileLeft(), allowOutOfBounds))
		{
			return false;
		}
		if (buildingSlot.interaction == InteractionLayout.Bottom && !CanBeInteractTile(encounter, buildingSlot.BottomInteractionTileRight(), allowOutOfBounds) && !CanBeInteractTile(encounter, buildingSlot.BottomInteractionTileLeft(), allowOutOfBounds))
		{
			return false;
		}
		int num = 0;
		interactTiles.Clear();
		GetInteractionTiles(buildingSlot.width, buildingSlot.height, buildingSlot.interaction, Vector2Int.zero, interactTiles);
		foreach (Vector2Int interactTile in interactTiles)
		{
			if (CanBeInteractTile(encounter, interactTile + buildingSlot.position, allowOutOfBounds))
			{
				num++;
			}
		}
		if (num == 0)
		{
			return false;
		}
		return true;
	}

	public static void GetAllBuildingsInteracts(List<Vector2Int> result, EncounterTemplate encounter)
	{
		result.Clear();
		BuildingSlot[] buildings = encounter.buildings;
		for (int i = 0; i < buildings.Length; i++)
		{
			BuildingSlot buildingSlot = buildings[i];
			GetInteractionTiles(buildingSlot.width, buildingSlot.height, buildingSlot.interaction, buildingSlot.position, result);
		}
	}

	public static void GetInteractionTiles(int width, int height, InteractionLayout interaction, Vector2Int offset, List<Vector2Int> list)
	{
		for (int i = -1; i <= width; i++)
		{
			for (int j = -1; j <= height; j++)
			{
				Vector2Int item = new Vector2Int(i, j) + offset;
				switch (interaction)
				{
				case InteractionLayout.CornerLeft:
					if ((j == -1 && i < width) || (i == -1 && j == 0))
					{
						list.Add(item);
					}
					break;
				case InteractionLayout.CornerRight:
					if ((j == -1 && i > -1) || (i == width && j == 0))
					{
						list.Add(item);
					}
					break;
				case InteractionLayout.Bottom:
					if (j == -1 || ((i == -1 || i == width) && j == 0))
					{
						list.Add(item);
					}
					break;
				case InteractionLayout.All:
					if (i == -1 || j == -1 || i == width || j == height)
					{
						list.Add(item);
					}
					break;
				}
			}
		}
	}

	public static bool CanBeMirroredByY(EncounterTemplate encounter)
	{
		for (int i = 0; i < encounter.buildings.Length; i++)
		{
			if (encounter.buildings[i].interaction != InteractionLayout.All)
			{
				return false;
			}
		}
		return true;
	}

	public static bool IsWithinBorders(Vector2Int position, int width, int height, int offset = 0)
	{
		return IsWithinBorders(position.x, position.y, width, height, offset);
	}

	public static bool IsWithinBorders(int x, int y, int width, int height, int offset = 0)
	{
		if (x >= offset && x < width - offset && y >= offset)
		{
			return y < height - offset;
		}
		return false;
	}

	private static void SetTileContent(EncounterTemplate encounter, int tile, EncounterTemplate.TileContent value)
	{
		encounter.tileContents[tile] = value;
	}

	private static void SetTileContent(EncounterTemplate encounter, int x, int y, EncounterTemplate.TileContent value)
	{
		encounter.tileContents[x + y * encounter.width] = value;
	}

	private static void SetTileContent(EncounterTemplate encounter, Vector2Int pos, EncounterTemplate.TileContent value)
	{
		SetTileContent(encounter, pos.x, pos.y, value);
	}

	private static EncounterTemplate.TileContent GetTileContent(EncounterTemplate encounter, int tile)
	{
		return encounter.tileContents[tile];
	}

	private static EncounterTemplate.TileContent GetTileContent(EncounterTemplate encounter, int x, int y)
	{
		return encounter.tileContents[x + y * encounter.width];
	}

	private static EncounterTemplate.TileContent GetTileContent(EncounterTemplate encounter, Vector2Int pos)
	{
		return GetTileContent(encounter, pos.x, pos.y);
	}

	private static void CheckKeyInteractTiles(out bool left, out bool right, EncounterTemplate encounter, int slotIndex, InteractionLayout interact)
	{
		bool num = encounter.guards.Length == 0;
		BuildingSlot buildingSlot = encounter.buildings[slotIndex];
		bool allowOutOfBounds = num;
		if (buildingSlot.interaction == InteractionLayout.All && interact != InteractionLayout.All)
		{
			allowOutOfBounds = false;
		}
		left = CanBeInteractTile(encounter, buildingSlot.BottomInteractionTileLeft(), allowOutOfBounds);
		right = CanBeInteractTile(encounter, buildingSlot.BottomInteractionTileRight(), allowOutOfBounds);
	}

	private static bool CanBeInteractTile(EncounterTemplate encounter, Vector2Int tile, bool allowOutOfBounds)
	{
		if (!IsWithinBorders(tile, encounter.width, encounter.height))
		{
			return allowOutOfBounds;
		}
		EncounterTemplate.TileContent tileContent = GetTileContent(encounter, tile);
		if (tileContent != EncounterTemplate.TileContent.Building && tileContent != EncounterTemplate.TileContent.Obstacle)
		{
			return tileContent != EncounterTemplate.TileContent.MaybeObstacle;
		}
		return false;
	}

	public static bool IsValidEntrancePosition(Vector2Int e, int width, int height)
	{
		bool num = e.x == width || e.x == -1;
		bool flag = e.y == height || e.y == -1;
		if (num ^ flag)
		{
			return IsWithinBorders(e, width, height, -1);
		}
		return false;
	}

	public static bool IsValidHoleTile(EncounterTemplate encounter, Vector2Int tile)
	{
		if (!IsWithinBorders(tile, encounter.width, encounter.height))
		{
			return false;
		}
		return GetTileContent(encounter, tile) == EncounterTemplate.TileContent.Obstacle;
	}

	public static bool IsValidRoadTarget(EncounterTemplate encounter, Vector2Int tile)
	{
		if (!IsWithinBorders(tile, encounter.width, encounter.height))
		{
			return false;
		}
		EncounterTemplate.TileContent tileContent = GetTileContent(encounter, tile);
		if (tileContent != EncounterTemplate.TileContent.Obstacle)
		{
			return tileContent != EncounterTemplate.TileContent.MaybeObstacle;
		}
		return false;
	}

	public static bool IsTileWalkable(EncounterTemplate.TileContent content)
	{
		return content switch
		{
			EncounterTemplate.TileContent.Free => true, 
			EncounterTemplate.TileContent.Obstacle => false, 
			EncounterTemplate.TileContent.MaybeObstacle => false, 
			EncounterTemplate.TileContent.Building => false, 
			EncounterTemplate.TileContent.Guard => true, 
			EncounterTemplate.TileContent.Pickup => true, 
			_ => false, 
		};
	}

	public static void FillUnreachable(EncounterTemplate encounter)
	{
		Vector2Int size = new Vector2Int(encounter.width, encounter.height);
		Pathfinder<int> pathfinder = GetPathfinder(encounter);
		bool[] array = new bool[size.x * size.y];
		foreach (Vector2Int entrance in encounter.entrances)
		{
			int num = GridUtils.CoordsToIndex(EntranceNeighbour(entrance, size.x, size.y), size);
			pathfinder.FindPathsToAll(num, out var predecessors);
			array[num] = true;
			for (int i = 0; i < array.Length; i++)
			{
				if (predecessors[i] != -1)
				{
					array[i] = true;
				}
			}
		}
		for (int j = 0; j < array.Length; j++)
		{
			if (!array[j] && GetTileContent(encounter, j) == EncounterTemplate.TileContent.Free)
			{
				SetTileContent(encounter, j, EncounterTemplate.TileContent.MaybeObstacle);
			}
		}
	}

	public static int GetBuildingMaskIndex(int width, int height, InteractionLayout interact)
	{
		int num = (width - 1) * 9 + (height - 1) * 3;
		switch (interact)
		{
		case InteractionLayout.CornerLeft:
			num = num;
			break;
		case InteractionLayout.CornerRight:
			num = num;
			break;
		case InteractionLayout.Bottom:
			num++;
			break;
		case InteractionLayout.All:
			num += 2;
			break;
		}
		return num + 1;
	}

	public static int GetPickupMaskIndex()
	{
		return 0;
	}

	public static bool CheckContentMask(EncounterTemplate template, uint mask)
	{
		if ((mask & 1) == 0 && template.pickups.Length != 0)
		{
			return false;
		}
		List<BuildingKey> maskBuildingKeys = GetMaskBuildingKeys();
		for (int i = 0; i < template.buildings.Length; i++)
		{
			bool flag = false;
			for (int j = 0; j < maskBuildingKeys.Count; j++)
			{
				if ((mask & (uint)(1 << j + 1)) != 0)
				{
					BuildingKey buildingKey = maskBuildingKeys[j];
					if (CanFitBuilding(template, i, buildingKey.width, buildingKey.height, buildingKey.interact))
					{
						flag = true;
						break;
					}
				}
			}
			if (!flag)
			{
				return false;
			}
		}
		return true;
	}

	private static List<BuildingKey> GetMaskBuildingKeys()
	{
		if (MaskBuildingKeys == null)
		{
			MaskBuildingKeys = new List<BuildingKey>();
			for (int i = 1; i <= 3; i++)
			{
				for (int j = 1; j <= 3; j++)
				{
					MaskBuildingKeys.Add(new BuildingKey(i, j, InteractionLayout.CornerLeft));
					MaskBuildingKeys.Add(new BuildingKey(i, j, InteractionLayout.Bottom));
					MaskBuildingKeys.Add(new BuildingKey(i, j, InteractionLayout.All));
				}
			}
		}
		return MaskBuildingKeys;
	}
}
