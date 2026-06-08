using System;
using System.Collections.Generic;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator;

public static class WalkablePaths
{
	private struct MoveCost : IComparable<MoveCost>
	{
		public readonly int g;

		public readonly int h;

		public int FCost => g + h;

		public MoveCost(int g, int h)
		{
			this.g = g;
			this.h = h;
		}

		public int CompareTo(MoveCost other)
		{
			if (FCost == other.FCost)
			{
				return g.CompareTo(other.g);
			}
			return FCost.CompareTo(other.FCost);
		}
	}

	private class CostCalculator : IPathfinderCostCalculator<MoveCost>
	{
		private Vector2Int size;

		private int[] penalties;

		private ObstacleState[] obstacles;

		public MoveCost MaxCost => new MoveCost(int.MaxValue, 0);

		public MoveCost MinCost => new MoveCost(0, 0);

		public CostCalculator(Vector2Int size, ObstacleState[] obstacles, ReadOnlyArray<PartitionData> partition)
		{
			this.size = size;
			this.obstacles = obstacles;
			penalties = new int[obstacles.Length];
			for (int i = 0; i < penalties.Length; i++)
			{
				if (!obstacles[i].IsWalkable())
				{
					continue;
				}
				int num = 0;
				GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(i, size, skipOutOfBounds: false).GetEnumerator();
				while (enumerator.MoveNext())
				{
					int current = enumerator.Current;
					if (current < 0 || !obstacles[current].IsWalkable())
					{
						num += 3;
					}
				}
				penalties[i] = num;
			}
		}

		public MoveCost CostToNeighbour(MoveCost currentCost, int current, int neighbour, int target)
		{
			Vector2Int vector2Int = GridUtils.IndexToCoords(current, size);
			Vector2Int vector2Int2 = GridUtils.IndexToCoords(neighbour, size);
			Vector2Int vector2Int3 = GridUtils.IndexToCoords(target, size);
			int num = Mathf.Abs(vector2Int.x - vector2Int2.x);
			int num2 = Mathf.Abs(vector2Int.y - vector2Int2.y);
			int num3 = 10;
			if (num > 0 && num2 > 0)
			{
				num3 = 14;
			}
			num3 += penalties[neighbour];
			if (obstacles[neighbour] == ObstacleState.AlwaysFree)
			{
				num3 -= 5;
			}
			int h = Mathf.FloorToInt((vector2Int2 - vector2Int3).magnitude * 10f);
			return new MoveCost(currentCost.g + num3, h);
		}
	}

	private static ProfilerMarker ProfilerMarker = new ProfilerMarker("DrawWalkablePaths");

	private static ProfilerMarker ProfilerMarkerGraph = new ProfilerMarker("BuildGraph");

	private static ProfilerMarker ProfilerMarkerDraw = new ProfilerMarker("DrawPaths");

	public static void DrawWalkablePaths(out WalkablePoints[] walkablePoints, out GraphData[] pathGraphs, ObstacleState[] obstacles, int zoneCount, Vector2Int mapSize, System.Random random, ReadOnlyArray<PartitionData> partitionData, ReadOnlyArray<Gate> gates, ZoneMap zoneMap, ReadOnlyArray<int> subzoneMap)
	{
		GraphData[] array = new GraphData[zoneCount];
		for (byte b = 0; b < zoneCount; b++)
		{
			array[b] = BuildCompleteZoneGraph(b, partitionData[b], mapSize, gates, subzoneMap);
		}
		walkablePoints = new WalkablePoints[zoneCount];
		pathGraphs = new GraphData[zoneCount];
		DrawPaths(obstacles, walkablePoints, pathGraphs, array, partitionData, zoneMap, zoneCount, mapSize, random);
	}

	private static void DrawPaths(ObstacleState[] obstacles, WalkablePoints[] walkablePoints, GraphData[] pathGraphs, GraphData[] completeGraphs, ReadOnlyArray<PartitionData> partitionData, ZoneMap zoneMap, int zoneCount, Vector2Int mapSize, System.Random random)
	{
		CostCalculator costCalculator = new CostCalculator(mapSize, obstacles, partitionData);
		Pathfinder<MoveCost> pathfinder = new Pathfinder<MoveCost>(mapSize.x * mapSize.y, null, costCalculator);
		int[] array = new int[obstacles.Length];
		Utils.FillArray(array, -1);
		List<int> list = new List<int>();
		byte zoneID;
		for (zoneID = 0; zoneID < zoneCount; zoneID++)
		{
			GridNeighboursGetter neighboursGetter = new GridNeighboursGetter(mapSize, (int index) => obstacles[index].IsWalkable() && zoneMap[index] == zoneID);
			pathfinder.SetNeighboursGetter(neighboursGetter);
			GraphData graphData = completeGraphs[zoneID];
			new Pathfinder<float>(graphData.graph.VertexCount, graphData.graph, graphData.graph).FindPathsToAll(0, out var predecessors);
			List<Vector2Int> list2 = new List<Vector2Int>();
			Graph graph = new Graph(graphData.graph.VertexCount);
			int[] array2 = new int[graphData.graph.VertexCount];
			for (int num = 0; num < graphData.graph.VertexCount; num++)
			{
				int num2 = predecessors[num];
				if (num2 >= 0)
				{
					array2[num2]++;
					graph.AddEdge(new Vector2Int(num, num2), 1f);
					list2.Add(new Vector2Int(num, num2));
				}
			}
			AddExtraSegments(list2, graphData.graph, graph, mapSize);
			Graph graph2 = new Graph(graphData.graph.VertexCount);
			for (int num3 = 0; num3 < list2.Count; num3++)
			{
				Vector2Int pair = list2[num3];
				graphData.graph.TryGetEdgeWeight(pair.x, pair.y, out var weight);
				graph2.AddEdge(pair, weight);
			}
			pathGraphs[zoneID] = new GraphData(graph2, graphData.vertexPositions);
			for (int num4 = 0; num4 < list2.Count; num4++)
			{
				Vector2Int vector2Int = list2[num4];
				int num5 = graphData.vertexPositions[vector2Int.x];
				int num6 = graphData.vertexPositions[vector2Int.y];
				if (pathfinder.TryFindPath(num5, num6, list))
				{
					int num7 = list.Count / 2;
					for (int num8 = 0; num8 < list.Count; num8++)
					{
						obstacles[list[num8]] = ObstacleState.AlwaysFree;
						array[list[num8]] = ((num8 < num7) ? vector2Int.x : vector2Int.y);
					}
					continue;
				}
				throw new GeneratorException($"Failed to draw a path between keypoints {GridUtils.IndexToCoords(num5, mapSize)} and {GridUtils.IndexToCoords(num6, mapSize)}.", Log.Context.ZoneIndex(zoneID));
			}
			walkablePoints[zoneID] = new WalkablePoints(array, zoneMap, zoneID, graphData.vertexPositions, mapSize);
		}
	}

	private static void AddExtraSegments(List<Vector2Int> segments, Graph completeGraph, Graph shortestPathTree, Vector2Int mapSize)
	{
		(List<Vector2Int>, List<float>) edgesCopy = completeGraph.GetEdgesCopy();
		List<Vector2Int> edges = edgesCopy.Item1;
		List<float> weights = edgesCopy.Item2;
		int[] array = new int[edges.Count];
		for (int i = 0; i < array.Length; i++)
		{
			array[i] = i;
		}
		Array.Sort(array, (int a, int b) => FitnessFunction(a).CompareTo(FitnessFunction(b)));
		Pathfinder<float> pathfinder = new Pathfinder<float>(shortestPathTree.VertexCount, shortestPathTree, shortestPathTree);
		List<int> list = new List<int>(10);
		int num = Mathf.RoundToInt((float)completeGraph.VertexCount * 0.2f);
		int num2 = 0;
		float num3 = 1f / (float)Mathf.Max(mapSize.x, mapSize.y);
		float num4 = num3 * 10f;
		float num5 = num3 * 30f;
		for (int num6 = 0; num6 < array.Length && num2 < num; num6++)
		{
			Vector2Int vector2Int = edges[array[num6]];
			if (completeGraph.TryGetEdgeWeight(vector2Int.x, vector2Int.y, out var weight))
			{
				if (weight > num5 * num5)
				{
					break;
				}
				if (weight < num4 * num4)
				{
					continue;
				}
			}
			pathfinder.TryFindPath(vector2Int.x, vector2Int.y, list);
			if (list.Count > 4)
			{
				segments.Add(vector2Int);
				shortestPathTree.AddEdge(vector2Int, 1f);
				num2++;
			}
		}
		float FitnessFunction(int index)
		{
			_ = edges[index];
			return weights[index];
		}
	}

	private static GraphData BuildCompleteZoneGraph(byte zoneID, PartitionData partitionData, Vector2Int mapSize, ReadOnlyArray<Gate> gates, ReadOnlyArray<int> subzoneMap)
	{
		List<int> list = new List<int>();
		List<Vector2Int> list2 = new List<Vector2Int>();
		list.AddRange(partitionData.keypoints);
		for (int i = 0; i < partitionData.mainObjectEncounters.Length; i++)
		{
			list.Add(partitionData.mainObjectEncounters[i].entrance);
		}
		int count = list.Count;
		for (int j = 0; j < count; j++)
		{
			for (int k = 0; k < j; k++)
			{
				if (subzoneMap[list[j]] == subzoneMap[list[k]])
				{
					list2.Add(new Vector2Int(j, k));
				}
			}
		}
		for (int l = 0; l < gates.Length; l++)
		{
			Gate gate = gates[l];
			if (!gate.isValid)
			{
				continue;
			}
			byte zoneFrom = gate.zoneFrom;
			byte zoneTo = gate.zoneTo;
			if (zoneFrom != zoneID && zoneTo != zoneID)
			{
				continue;
			}
			if (zoneFrom == zoneTo)
			{
				int subzoneFrom = gate.subzoneFrom;
				int subzoneTo = gate.subzoneTo;
				list.Add(gate.GetRoadPointFrom(mapSize));
				list.Add(gate.GetRoadPointTo(mapSize));
				int num = list.Count - 2;
				int y = list.Count - 1;
				for (int m = 0; m < count; m++)
				{
					if (subzoneMap[list[m]] == subzoneFrom)
					{
						list2.Add(new Vector2Int(m, num));
					}
				}
				for (int n = 0; n < count; n++)
				{
					if (subzoneMap[list[n]] == subzoneTo)
					{
						list2.Add(new Vector2Int(n, y));
					}
				}
				list2.Add(new Vector2Int(num, y));
				continue;
			}
			int num2 = ((zoneTo == zoneID) ? gate.GetRoadPointTo(mapSize) : gate.GetRoadPointFrom(mapSize));
			list.Add(num2);
			int y2 = list.Count - 1;
			int num3 = subzoneMap[num2];
			for (int num4 = 0; num4 < count; num4++)
			{
				if (subzoneMap[list[num4]] == num3)
				{
					list2.Add(new Vector2Int(num4, y2));
				}
			}
		}
		Graph graph = new Graph(list.Count);
		foreach (Vector2Int item in list2)
		{
			Vector2 vector = GridUtils.IndexToPosition(list[item.x], mapSize);
			Vector2 vector2 = GridUtils.IndexToPosition(list[item.y], mapSize);
			graph.AddEdge(item, (vector - vector2).sqrMagnitude);
		}
		return new GraphData(graph, list);
	}
}
