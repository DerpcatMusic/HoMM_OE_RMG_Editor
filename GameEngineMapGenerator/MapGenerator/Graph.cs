using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class Graph : IPathfinderNeighboursGetter, IPathfinderCostCalculator<float>
{
	private readonly List<int>[] neighbours;

	private readonly Dictionary<Vector2Int, float> edgeWeights;

	private readonly ListEnumeratorWrapper<int> enumeratorWrapper;

	public int VertexCount { get; }

	public float MaxCost => float.MaxValue;

	public float MinCost => 0f;

	public Graph(int vertexCount)
	{
		VertexCount = vertexCount;
		neighbours = new List<int>[vertexCount];
		edgeWeights = new Dictionary<Vector2Int, float>();
		for (int i = 0; i < vertexCount; i++)
		{
			neighbours[i] = new List<int>(5);
		}
		enumeratorWrapper = new ListEnumeratorWrapper<int>();
	}

	public bool TryGetEdgeWeight(int from, int to, out float weight)
	{
		return edgeWeights.TryGetValue(Utils.Order(from, to), out weight);
	}

	public void AddEdge(Vector2Int pair, float weight)
	{
		neighbours[pair.x].Add(pair.y);
		neighbours[pair.y].Add(pair.x);
		edgeWeights.Add(Utils.Order(pair), weight);
	}

	public (List<Vector2Int> edges, List<float> weights) GetEdgesCopy()
	{
		return (edges: new List<Vector2Int>(edgeWeights.Keys), weights: new List<float>(edgeWeights.Values));
	}

	public Dictionary<Vector2Int, float> GetEdges()
	{
		return edgeWeights;
	}

	public IEnumerator<int> GetNeighbours(int index)
	{
		enumeratorWrapper.Set(neighbours[index].GetEnumerator());
		return enumeratorWrapper;
	}

	public float CostToNeighbour(float currentCost, int current, int neighbour, int target)
	{
		if (TryGetEdgeWeight(current, neighbour, out var weight))
		{
			return currentCost + weight;
		}
		return MaxCost;
	}
}
