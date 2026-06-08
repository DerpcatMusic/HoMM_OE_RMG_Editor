using System;
using System.Collections.Generic;
using Hex.Map;
using UnityEngine;

namespace Hex.MapGenerator;

public class MapObjectsRegistry
{
	private class MapDataObjectsList
	{
		private readonly MapObjectsRegistry registry;

		private readonly string sid;

		private List<int> ids = new List<int>();

		private List<int> nodes = new List<int>();

		private List<byte> rotations = new List<byte>();

		private List<float> levels = new List<float>();

		public MapDataObjectsList(string sid, MapObjectsRegistry registry)
		{
			this.sid = sid;
			this.registry = registry;
		}

		public int AddObject(int node, byte rotation, float level)
		{
			int num = registry.NextID();
			ids.Add(num);
			nodes.Add(node);
			rotations.Add(rotation);
			levels.Add(level);
			return num;
		}

		public MapDataObjects ConvertToMapDataObjects()
		{
			return new MapDataObjects
			{
				sid = sid,
				ids = ids.ToArray(),
				nodes = nodes.ToArray(),
				rotations = rotations.ToArray(),
				levels = levels.ToArray()
			};
		}
	}

	private readonly Vector2Int mapSize;

	private readonly Dictionary<string, MapDataObjectsList> mapObjects;

	private readonly List<(int, ObjectProp)> objectProps;

	private readonly List<int> keyObjects;

	private readonly int[] keyObjectsByZone;

	private int RunningID;

	public int NextID()
	{
		return RunningID++;
	}

	public MapObjectsRegistry(Vector2Int mapSize, int zoneCount)
	{
		this.mapSize = mapSize;
		mapObjects = new Dictionary<string, MapDataObjectsList>();
		objectProps = new List<(int, ObjectProp)>();
		keyObjects = new List<int>();
		keyObjectsByZone = new int[zoneCount];
		for (int i = 0; i < zoneCount; i++)
		{
			keyObjectsByZone[i] = -1;
		}
	}

	public void WriteToMapData(MapData mapData)
	{
		MapDataObjects[] array = new MapDataObjects[mapObjects.Count];
		int num = 0;
		foreach (KeyValuePair<string, MapDataObjectsList> mapObject in mapObjects)
		{
			array[num] = mapObject.Value.ConvertToMapDataObjects();
			num++;
		}
		mapData.objects = array;
		for (int i = 0; i < objectProps.Count; i++)
		{
			var (objectId, prop) = objectProps[i];
			mapData.objectsProperties.AddFromGenerator(ObjectProp.EType.MapObject, objectId, prop);
		}
		mapData.keyObjects = keyObjects;
		for (int j = 0; j < keyObjectsByZone.Length; j++)
		{
			mapData.areas[j].keyObjectId = keyObjectsByZone[j];
		}
		mapData.objectsFreeId = NextID();
	}

	public int AddObject(ObjectConfig obj, MapObjectPosition pos)
	{
		return GetMapObjectsList(obj.sid).AddObject(pos.tile, (byte)pos.rotation, pos.level);
	}

	public int AddObject(ObjectConfig obj, int variant, byte biome, MapObjectPosition pos)
	{
		int num = GetMapObjectsList(obj.sid).AddObject(pos.tile, (byte)pos.rotation, pos.level);
		if (variant >= 0)
		{
			PropVariant propVariant = new PropVariant();
			propVariant.selectedVar = variant;
			propVariant.fraction = ContentDatabase.GetMetaObjectFaction(biome);
			AddProp(num, propVariant);
		}
		return num;
	}

	public int AddBuilding(ObjectConfig obj, int variant, byte biome, Vector2Int position, bool flip)
	{
		Vector2Int vector2Int = new Vector2Int(obj.generatorConfig.buildingLeftBottomX, obj.generatorConfig.buildingLeftBottomZ);
		Vector2Int vector2Int2 = new Vector2Int(obj.pivotX, obj.pivotZ);
		if (flip)
		{
			vector2Int.x = obj.sizeX - vector2Int.x - obj.generatorConfig.buildingSizeX;
			vector2Int2.x = obj.sizeX - vector2Int2.x - obj.flippedOffset - 1;
		}
		vector2Int.y = -vector2Int.y;
		vector2Int2.y = -vector2Int2.y;
		position -= vector2Int;
		position += vector2Int2;
		int tile = GridUtils.CoordsToIndex(position, mapSize);
		int rotation = (flip ? 10 : 0);
		return AddObject(obj, variant, biome, new MapObjectPosition(tile, rotation));
	}

	public void AddEnvironmentObject(ObjectConfig obj, int tile, System.Random random)
	{
		Vector2Int coords = GridUtils.IndexToCoords(tile, mapSize);
		coords.x += obj.pivotX;
		coords.y -= obj.pivotZ;
		coords.y += Mathf.Max(obj.sizeZ, 1) - 1;
		tile = GridUtils.CoordsToIndex(coords, mapSize);
		int num = ((!obj.randomRotation) ? ((random.Next(2) <= 0) ? 10 : 0) : random.Next(4));
		GetMapObjectsList(obj.sid).AddObject(tile, (byte)num, 0f);
	}

	public int AddCity(int tile, bool flip, string factionSid, SquadParams? squad, MapDescription.MainObject mainObj)
	{
		string sid = null;
		switch (mainObj.type)
		{
		case MainObjectType.City:
			sid = "random-city";
			break;
		case MainObjectType.Spawn:
			sid = "city-spawner";
			break;
		case MainObjectType.AbandonedOutpost:
			sid = "abandoned_outpost";
			break;
		}
		tile = GridUtils.CoordsToIndex(GridUtils.IndexToCoords(tile, mapSize) + new Vector2Int(0, 2), mapSize);
		byte rotation = (byte)(flip ? 10u : 0u);
		int num = GetMapObjectsList(sid).AddObject(tile, rotation, 0f);
		PropCity propCity = new PropCity();
		propCity.isDefined = true;
		propCity.factionSid = factionSid;
		if (!string.IsNullOrEmpty(mainObj.buildingsConstructionSid))
		{
			propCity.buildingsConstructionSid = mainObj.buildingsConstructionSid;
		}
		if (!string.IsNullOrEmpty(mainObj.buildingsBanSid))
		{
			propCity.buildingsBanSid = mainObj.buildingsBanSid;
		}
		AddProp(num, propCity);
		if (mainObj.type == MainObjectType.Spawn)
		{
			PropSpawn propSpawn = new PropSpawn();
			propSpawn.owner = mainObj.spawn;
			AddProp(num, propSpawn);
		}
		if (mainObj.type == MainObjectType.City)
		{
			AddProp(num, CreatePropOwner(mainObj.owner));
		}
		if (((mainObj.type != MainObjectType.Spawn && (mainObj.type != MainObjectType.City || !mainObj.owner.HasValue)) || !mainObj.removeGuardIfHasOwner) && squad.HasValue)
		{
			AddProp(num, CreatePropRandomSquad(squad.Value));
		}
		if (mainObj.type == MainObjectType.City || mainObj.type == MainObjectType.Spawn || mainObj.type == MainObjectType.AbandonedOutpost)
		{
			PropGrowthUnits prop = new PropGrowthUnits
			{
				countGrowth = mainObj.initialUnitIncrement,
				isConstantGrowth = mainObj.enableWeeklyUnitIncrement
			};
			AddProp(num, prop);
		}
		return num;
	}

	public int AddGladiatorArena(int position)
	{
		Vector2Int coords = GridUtils.IndexToCoords(position, mapSize);
		coords.x -= 2;
		coords.y += 2;
		position = GridUtils.CoordsToIndex(coords, mapSize);
		return GetMapObjectsList("gladiator_arena").AddObject(position, 0, 0f);
	}

	public void AddProp(int id, ObjectProp prop)
	{
		objectProps.Add((id, prop));
	}

	public void AddKeyObject(int id, int zoneID)
	{
		keyObjects.Add(id);
		keyObjectsByZone[zoneID] = id;
	}

	public void AddOwner(int id, ESpawn owner)
	{
		AddProp(id, CreatePropOwner(owner));
	}

	public void AddRandomSquad(int tile, SquadParams squad)
	{
		int id = GetMapObjectsList("random-squad").AddObject(tile, 0, 0f);
		AddProp(id, CreatePropRandomSquad(squad));
	}

	public void MakePortalPair(int fromID, int toID, bool fromEnabled, bool toEnabled, SquadParams squad)
	{
		PropPortals propPortals = new PropPortals();
		propPortals.isActive = fromEnabled;
		PropPortals propPortals2 = new PropPortals();
		propPortals2.isActive = toEnabled;
		propPortals.targetIdx = toID;
		propPortals2.targetIdx = fromID;
		AddProp(fromID, propPortals);
		AddProp(toID, propPortals2);
		AddProp(fromID, CreatePropRandomSquad(squad));
		AddProp(toID, CreatePropRandomSquad(squad));
	}

	private PropRandomSquad CreatePropRandomSquad(SquadParams pars)
	{
		PropRandomSquad propRandomSquad = new PropRandomSquad();
		propRandomSquad.requestedValue = pars.value;
		propRandomSquad.weeklyIncrementBonus = pars.weeklyIncrement;
		propRandomSquad.isMainGuard = pars.isMain;
		propRandomSquad.isEscape = pars.escape;
		propRandomSquad.reactionType = pars.disposition;
		propRandomSquad.diplomacyUnitsCountBonus = pars.diplomacyModifier;
		if (pars.squadConfig != null)
		{
			propRandomSquad.sids = new List<string> { pars.squadConfig.sid };
		}
		return propRandomSquad;
	}

	private PropOwner CreatePropOwner(ESpawn? spawn)
	{
		PropOwner propOwner = new PropOwner();
		if (spawn.HasValue)
		{
			propOwner.owner = (EOwner)(spawn.Value - 1);
		}
		else
		{
			propOwner.owner = EOwner.none;
		}
		return propOwner;
	}

	public Dictionary<int, int> GetDebugInfo()
	{
		Dictionary<int, int> dictionary = new Dictionary<int, int>();
		foreach (var (key, objectProp) in objectProps)
		{
			if (objectProp is PropVariant)
			{
				dictionary[key] = (objectProp as PropVariant).selectedVar;
			}
		}
		return dictionary;
	}

	private MapDataObjectsList GetMapObjectsList(string sid)
	{
		if (mapObjects.TryGetValue(sid, out var value))
		{
			return value;
		}
		MapDataObjectsList mapDataObjectsList = new MapDataObjectsList(sid, this);
		mapObjects.Add(sid, mapDataObjectsList);
		return mapDataObjectsList;
	}
}
