using System;
using System.Collections.Generic;
using Hex.Map;
using UnityEngine;

namespace Hex.MapGenerator;

public class EnvironmentPlacer
{
	private static class Tags
	{
		public const string ZoneBorder = "zone_border";

		public const string Filler = "filler";
	}

	public class Assets
	{
		[Flags]
		public enum RuleFlags
		{
			None = 0,
			NotOnZoneBorder = 1,
			NotOnMapBorder = 2
		}

		public class Biome
		{
			public readonly EnvironmentAssets.BiomeConfig config;

			public readonly Tileset[] tilesets;

			public readonly Tileset walkable;

			public readonly Tileset water;

			public readonly bool hasBorderTilesets;

			public Biome(EnvironmentAssets.BiomeConfig config)
			{
				this.config = config;
				tilesets = new Tileset[config.tilesets.Length];
				hasBorderTilesets = false;
				for (int i = 0; i < tilesets.Length; i++)
				{
					tilesets[i] = new Tileset(config.tilesets[i]);
					if (tilesets[i].tagsHashSet.Contains("zone_border"))
					{
						hasBorderTilesets = true;
					}
				}
				walkable = new Tileset(config.walkable);
				water = new Tileset(config.water);
			}
		}

		public class Tileset
		{
			public readonly TilesetConfig config;

			public readonly Tile[] obstacles;

			public readonly Tile[] skirt;

			public readonly HashSet<string> tagsHashSet;

			public Tileset(TilesetConfig config)
			{
				this.config = config;
				obstacles = InitializeTiles(config.obstacles);
				skirt = InitializeTiles(config.skirt);
				tagsHashSet = new HashSet<string>(config.tags);
			}

			private Tile[] InitializeTiles(TilesetConfig.Tile[] configs)
			{
				Tile[] array = new Tile[configs.Length];
				for (int i = 0; i < array.Length; i++)
				{
					TilesetConfig.Tile tile = configs[i];
					ObjectConfig objectConfig = MapConfig.me.objects.Get(tile.sids[0]);
					Vector2Int size = new Vector2Int(objectConfig.sizeX, objectConfig.sizeZ);
					size.x = Mathf.Max(objectConfig.sizeX, 1);
					size.y = Mathf.Max(objectConfig.sizeZ, 1);
					RuleFlags ruleFlags = RuleFlags.None;
					for (int j = 0; j < tile.rules.Length; j++)
					{
						switch (tile.rules[j].type)
						{
						case TileRuleType.NotOnZoneBorder:
							ruleFlags |= RuleFlags.NotOnZoneBorder;
							break;
						case TileRuleType.NotOnMapBorder:
							ruleFlags |= RuleFlags.NotOnMapBorder;
							break;
						}
					}
					array[i] = new Tile(tile, size, ruleFlags);
				}
				return array;
			}
		}

		public class Tile
		{
			public readonly TilesetConfig.Tile config;

			public readonly Vector2Int size;

			public readonly RuleFlags ruleFlags;

			public Tile(TilesetConfig.Tile config, Vector2Int size, RuleFlags ruleFlags)
			{
				this.config = config;
				this.size = size;
				this.ruleFlags = ruleFlags;
			}
		}

		private ContentDatabase contentDatabase;

		private Biome[] biomes;

		private int[] biomeIndexByTileId;

		public static bool HasRuleFlag(RuleFlags flags, RuleFlags value)
		{
			return (flags & value) != 0;
		}

		public Biome GetBiomeByID(int id)
		{
			return biomes[biomeIndexByTileId[contentDatabase.GetBiomeIndexById((byte)id)]];
		}

		public Assets(EnvironmentAssets assets, ContentDatabase contentDatabase)
		{
			this.contentDatabase = contentDatabase;
			biomes = new Biome[assets.biomes.Length];
			for (int i = 0; i < biomes.Length; i++)
			{
				biomes[i] = new Biome(assets.biomes[i]);
			}
			biomeIndexByTileId = new int[contentDatabase.GetBiomesCount()];
			for (int j = 0; j < biomes.Length; j++)
			{
				if (contentDatabase.TryGetTileConfigByBiomeSid(biomes[j].config.sid, out var config))
				{
					biomeIndexByTileId[contentDatabase.GetBiomeIndexById(config.id)] = j;
				}
			}
		}
	}

	public struct WeightsArray
	{
		private unsafe fixed float w[8];

		public unsafe float this[int i]
		{
			get
			{
				if (i < 0 || i >= 8)
				{
					throw new IndexOutOfRangeException();
				}
				return w[i];
			}
			set
			{
				if (i < 0 || i >= 8)
				{
					throw new IndexOutOfRangeException();
				}
				w[i] = value;
			}
		}

		public unsafe int WeightedIndex(System.Random random)
		{
			float num = (float)random.NextDouble();
			float num2 = 0f;
			for (int i = 0; i < 8; i++)
			{
				num2 += w[i];
			}
			float num3 = num * num2;
			for (int num4 = 7; num4 >= 0; num4--)
			{
				num2 -= w[num4];
				if (num2 < num3)
				{
					return num4;
				}
			}
			return 0;
		}
	}

	public class DebugInfo
	{
		public float[] distanceToBorder;

		public float[] distanceToObstacle;

		public DebugInfo(float[] distanceToBorder, float[] distanceToObstacle)
		{
			this.distanceToBorder = distanceToBorder;
			this.distanceToObstacle = distanceToObstacle;
		}
	}

	public const int MaxTilesetCount = 8;

	private const int MaxAssetSize = 5;

	private const int maxIslandArea = 100;

	private readonly MapObjectsRegistry registry;

	private readonly ContentDatabase database;

	private readonly MapDescription mapDesc;

	private readonly Layout layout;

	private readonly ObstacleState[] obstaclesMap;

	private readonly System.Random random;

	private readonly Assets assets;

	private readonly List<int> tempIndices = new List<int>();

	private readonly List<float> tempWeights = new List<float>();

	private DebugInfo debugInfo;

	public EnvironmentPlacer(EnvironmentAssets environmentAssets, MapObjectsRegistry registry, ContentDatabase database, Layout layout, MapDescription mapDesc, ObstacleState[] obstaclesMap, int seed)
	{
		this.registry = registry;
		this.database = database;
		this.mapDesc = mapDesc;
		this.layout = layout;
		this.obstaclesMap = obstaclesMap;
		random = new Rng(seed).Create();
		assets = new Assets(environmentAssets, database);
	}

	public void PlaceAssets()
	{
		int[] availableRects = new int[5];
		bool[] array = new bool[layout.TileCount];
		WeightsArray[] array2 = new WeightsArray[layout.TileCount];
		float[] array3 = CreateDistanceToBorderMap();
		var (isandPositions, array4) = FindObstacleIslands();
		InitializeWeights(array2, isandPositions, array3);
		TileRules rules = new TileRules(array3, layout);
		Func<int, bool> func = (int tile) => obstaclesMap[tile].IsObstacle();
		Func<int, bool> func2 = (int tile) => IsSuitableForWalkableAssets(tile);
		Func<int, bool> func3 = (int tile) => obstaclesMap[tile] == ObstacleState.Water;
		int num = 1;
		string biomeForWater = Generator.GetConfig().GetBiomeForWater(mapDesc.border.waterType);
		if (biomeForWater != null)
		{
			int? biomeIdForSid = database.GetBiomeIdForSid(biomeForWater);
			if (biomeIdForSid.HasValue)
			{
				num = biomeIdForSid.Value;
			}
		}
		for (int num2 = 0; num2 < layout.TileCount; num2++)
		{
			if (array[num2])
			{
				continue;
			}
			int id = 1;
			byte? visualZoneIdAt = layout.GetVisualZoneIdAt(num2);
			if (visualZoneIdAt.HasValue)
			{
				id = mapDesc.zones[visualZoneIdAt.Value].zoneBiome;
			}
			Assets.Biome biomeByID = assets.GetBiomeByID(id);
			int num3 = array2[num2].WeightedIndex(random);
			Assets.Tileset tileset = biomeByID.tilesets[num3];
			bool num4 = func(num2);
			bool flag = func2(num2);
			bool flag2 = func3(num2);
			Assets.Tile[] tiles;
			if (num4)
			{
				CalculateAvailableRects(availableRects, num2, func, array);
				tiles = tileset.obstacles;
			}
			else if (flag2)
			{
				int waterAt = layout.GetWaterAt(num2);
				if (waterAt < 0)
				{
					continue;
				}
				int id2 = num;
				if (waterAt != 255)
				{
					id2 = mapDesc.zones[waterAt].zoneBiome;
				}
				Assets.Biome biomeByID2 = assets.GetBiomeByID(id2);
				if (!((float)random.Next(100) < biomeByID2.water.config.skirtFill * 100f))
				{
					continue;
				}
				CalculateAvailableRects(availableRects, num2, func3, array);
				tiles = biomeByID2.water.skirt;
			}
			else
			{
				float num5 = array4[num2];
				bool flag3 = false;
				if (num5 <= 1.5f)
				{
					flag3 = ((!(num5 <= 1f)) ? ((double)random.Next(100) < (double)tileset.config.skirtFill * 0.5 * 100.0) : ((float)random.Next(100) < tileset.config.skirtFill * 100f));
					tiles = tileset.skirt;
				}
				else
				{
					flag3 = (float)random.Next(100) < biomeByID.walkable.config.skirtFill * 100f;
					tiles = biomeByID.walkable.skirt;
				}
				if (!(flag && flag3))
				{
					continue;
				}
				CalculateAvailableRects(availableRects, num2, func2, array);
			}
			ObjectConfig objectConfig = PickTile(tiles, num2, availableRects, rules);
			if (objectConfig == null)
			{
				array[num2] = true;
				continue;
			}
			for (int num6 = 0; num6 < objectConfig.sizeX; num6++)
			{
				for (int num7 = 0; num7 < objectConfig.sizeZ; num7++)
				{
					Vector2Int coords = GridUtils.IndexToCoords(num2, layout.Size) + new Vector2Int(num6, num7);
					array[GridUtils.CoordsToIndex(coords, layout.Size)] = true;
				}
			}
			registry.AddEnvironmentObject(objectConfig, num2, random);
		}
		debugInfo = new DebugInfo(array3, array4);
		bool IsSuitableForWalkableAssets(int tile)
		{
			if (obstaclesMap[tile].IsWalkable())
			{
				return !layout.GetRoadAt(tile).HasValue;
			}
			return false;
		}
	}

	private (List<int>[], float[]) FindObstacleIslands()
	{
		FloodFiller floodFiller = new FloodFiller(layout.Size);
		MapFilterCondition filter = new MapFilterCondition((int tile) => obstaclesMap[tile].IsObstacle());
		MapFilterValue<byte> filter2 = new MapFilterValue<byte>((int tile) => layout.GetVisualZoneIdAt(tile) ?? byte.MaxValue, 0);
		MapFilterValue<sbyte> filter3 = new MapFilterValue<sbyte>((int tile) => layout.GetElevationAt(tile), 0);
		floodFiller.AttachFilter(filter);
		floodFiller.AttachFilter(filter2, addBorder: false, grabValueOnStart: true);
		floodFiller.AttachFilter(filter3, addBorder: false, grabValueOnStart: true);
		(int[] map, int[][] tilesOfArea) tuple = floodFiller.FindAllContinuousAreas(Neighbourhood.All, 0, 100);
		int[] item = tuple.map;
		int num = tuple.tilesOfArea.Length;
		float[] array = new float[layout.TileCount];
		List<int>[] array2 = new List<int>[num];
		for (int num2 = 0; num2 < num; num2++)
		{
			array2[num2] = new List<int>();
		}
		Vector2Int size = layout.Size;
		for (int num3 = 0; num3 < layout.TileCount; num3++)
		{
			Vector2Int vector2Int = GridUtils.IndexToCoords(num3, layout.Size);
			float num4 = 1000000f;
			int num5 = -1;
			byte? visualZoneIdAt = layout.GetVisualZoneIdAt(num3);
			sbyte elevationAt = layout.GetElevationAt(num3);
			for (int num6 = -1; num6 <= 1; num6++)
			{
				for (int num7 = -1; num7 <= 1; num7++)
				{
					Vector2Int vector2Int2 = vector2Int + new Vector2Int(num6, num7);
					vector2Int2.x = Mathf.Clamp(vector2Int2.x, 0, size.x - 1);
					vector2Int2.y = Mathf.Clamp(vector2Int2.y, 0, size.y - 1);
					int num8 = GridUtils.CoordsToIndex(vector2Int2, size);
					float num9 = (vector2Int2 - vector2Int).sqrMagnitude;
					if (num9 < num4)
					{
						int num10 = item[num8];
						if (obstaclesMap[num8].IsObstacle() && num10 != -1 && layout.GetVisualZoneIdAt(num8) == visualZoneIdAt && layout.GetElevationAt(num8) == elevationAt)
						{
							num4 = num9;
							num5 = num10;
						}
					}
				}
			}
			array[num3] = Mathf.Sqrt(num4);
			if (num5 != -1)
			{
				array2[num5].Add(num3);
			}
		}
		return (array2, array);
	}

	private float[] CreateDistanceToBorderMap()
	{
		float[] array = new float[layout.TileCount];
		Queue<(int, int)> queue = new Queue<(int, int)>();
		Utils.FillArray(array, float.MaxValue);
		bool flag = layout.MapDesc.border.waterWidth > 0;
		bool flag2 = layout.MapDesc.border.obstaclesWidth > 3;
		for (int i = 0; i < layout.TileCount; i++)
		{
			bool flag3 = false;
			flag3 |= obstaclesMap[i] == ObstacleState.Border;
			Vector2Int coords = GridUtils.IndexToCoords(i, layout.Size);
			if ((!flag || flag2) && Mathf.Abs(MapShape.DistanceToBorder(coords, layout.Size, layout.MapDesc, waterOnly: false) - (float)layout.MapDesc.border.obstaclesWidth) < 0.5f)
			{
				flag3 = true;
			}
			if (flag3)
			{
				queue.Enqueue((i, 0));
			}
		}
		while (queue.Count > 0)
		{
			int num;
			int num2;
			(num, num2) = queue.Dequeue();
			if ((float)num2 < array[num])
			{
				array[num] = num2;
				num2++;
				GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursCardinal(num, layout.Size).GetEnumerator();
				while (enumerator.MoveNext())
				{
					int current = enumerator.Current;
					queue.Enqueue((current, num2));
				}
			}
		}
		return array;
	}

	private void InitializeWeights(WeightsArray[] weightsMap, List<int>[] isandPositions, float[] distanceToBorder)
	{
		foreach (List<int> list in isandPositions)
		{
			if (list.Count != 0)
			{
				byte? visualZoneIdAt = layout.GetVisualZoneIdAt(list[0]);
				int id = 1;
				if (visualZoneIdAt.HasValue)
				{
					id = mapDesc.zones[visualZoneIdAt.Value].zoneBiome;
				}
				Assets.Biome biomeByID = assets.GetBiomeByID(id);
				SelectTilesetForIsland(weightsMap, list, biomeByID);
				WriteBordersToWeights(weightsMap, list, biomeByID, distanceToBorder);
			}
		}
	}

	private void SelectTilesetForIsland(WeightsArray[] weightsMap, List<int> positions, Assets.Biome biome)
	{
		WeightsArray weightsArray = default(WeightsArray);
		for (int i = 0; i < biome.tilesets.Length; i++)
		{
			Assets.Tileset tileset = biome.tilesets[i];
			weightsArray[i] = tileset.config.weight;
		}
		int num = weightsArray.WeightedIndex(random);
		WeightsArray weightsArray2 = default(WeightsArray);
		for (int j = 0; j < biome.tilesets.Length; j++)
		{
			weightsArray2[j] = ((j == num) ? 1 : 0);
		}
		weightsArray = default(WeightsArray);
		bool flag = false;
		for (int k = 0; k < biome.tilesets.Length; k++)
		{
			if (biome.tilesets[k].tagsHashSet.Contains("filler"))
			{
				weightsArray[k] = 1f;
				flag = true;
			}
		}
		if (!flag)
		{
			for (int l = 0; l < biome.tilesets.Length; l++)
			{
				if (biome.tilesets[l].tagsHashSet.Contains("zone_border"))
				{
					weightsArray[l] = 1f;
				}
			}
		}
		int num2 = weightsArray.WeightedIndex(random);
		WeightsArray weightsArray3 = default(WeightsArray);
		for (int m = 0; m < biome.tilesets.Length; m++)
		{
			weightsArray3[m] = ((m == num2) ? 1 : 0);
		}
		foreach (int position in positions)
		{
			if (MapShape.DistanceToBorder(GridUtils.IndexToCoords(position, layout.Size), layout.Size, mapDesc, waterOnly: false) > (float)layout.MapDesc.border.obstaclesWidth)
			{
				weightsMap[position] = weightsArray3;
			}
			else
			{
				weightsMap[position] = weightsArray2;
			}
		}
	}

	private void WriteBordersToWeights(WeightsArray[] weightsMap, List<int> positions, Assets.Biome biome, float[] distanceToBorder)
	{
		if (!biome.hasBorderTilesets)
		{
			return;
		}
		WeightsArray weightsArray = default(WeightsArray);
		for (int i = 0; i < biome.tilesets.Length; i++)
		{
			if (biome.tilesets[i].tagsHashSet.Contains("zone_border"))
			{
				weightsArray[i] = 1f;
			}
		}
		int i2 = weightsArray.WeightedIndex(random);
		foreach (int position in positions)
		{
			float num = distanceToBorder[position];
			float num2 = Mathf.Lerp(20f, 0f, Mathf.Clamp01(num / 2f));
			WeightsArray weightsArray2 = weightsMap[position];
			weightsArray2[i2] += num2;
			weightsMap[position] = weightsArray2;
		}
	}

	private void CalculateAvailableRects(int[] availableRects, int tile, Func<int, bool> condition, bool[] isTileTaken)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(tile, layout.Size);
		int num = 5;
		for (int i = 0; i < 5; i++)
		{
			availableRects[i] = num;
			for (int j = 0; j < num; j++)
			{
				Vector2Int coords = vector2Int + new Vector2Int(j, i);
				int num2 = GridUtils.CoordsToIndex(coords, layout.Size);
				if (!GridUtils.CheckBounds(coords, layout.Size) || isTileTaken[num2] || !condition(num2))
				{
					num = j;
					availableRects[i] = j;
					break;
				}
			}
		}
	}

	private ObjectConfig PickTile(Assets.Tile[] tiles, int position, int[] availableRects, TileRules rules)
	{
		tempIndices.Clear();
		tempWeights.Clear();
		for (int i = 0; i < tiles.Length; i++)
		{
			Assets.Tile tile = tiles[i];
			if (tile.size.x <= availableRects[tile.size.y - 1] && (!Assets.HasRuleFlag(tile.ruleFlags, Assets.RuleFlags.NotOnMapBorder) || rules.NotOnMapBorder(position, tile.size)) && (!Assets.HasRuleFlag(tile.ruleFlags, Assets.RuleFlags.NotOnZoneBorder) || rules.NotOnZoneBorder(position, tile.size)))
			{
				tempIndices.Add(i);
				tempWeights.Add(tile.config.weight);
			}
		}
		if (tempIndices.Count == 0)
		{
			return null;
		}
		int num = tempIndices[RngUtils.WeightedIndex(tempWeights, random)];
		string[] sids = tiles[num].config.sids;
		string id = sids[random.Next(sids.Length)];
		return MapConfig.me.objects.Get(id);
	}

	public DebugInfo GetDebugInfo()
	{
		return debugInfo;
	}
}
