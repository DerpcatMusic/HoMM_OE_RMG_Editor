using System;
using System.Collections.Generic;

namespace Hex.MapGenerator;

public class Pathfinder<TCost> where TCost : struct, IComparable<TCost>
{
	private PriorityQueue<int, TCost> queue;

	private int[] predecessors;

	private TCost[] costs;

	private IPathfinderNeighboursGetter neighboursGetter;

	private IPathfinderCostCalculator<TCost> costCalculator;

	private TCost maxCost;

	private TCost minCost;

	public Pathfinder(int graphSize, IPathfinderNeighboursGetter neighboursGetter, IPathfinderCostCalculator<TCost> costCalculator)
	{
		queue = new PriorityQueue<int, TCost>(graphSize / 4);
		costs = new TCost[graphSize];
		predecessors = new int[graphSize];
		SetNeighboursGetter(neighboursGetter);
		SetCostCalculator(costCalculator);
	}

	public void SetNeighboursGetter(IPathfinderNeighboursGetter neighboursGetter)
	{
		this.neighboursGetter = neighboursGetter;
	}

	public void SetCostCalculator(IPathfinderCostCalculator<TCost> costCalculator)
	{
		this.costCalculator = costCalculator;
		maxCost = costCalculator.MaxCost;
		minCost = costCalculator.MinCost;
	}

	public void FindPathsToAll(int start, out int[] predecessors)
	{
		predecessors = new int[this.predecessors.Length];
		FindPaths(start, null, -1, null, out var _, predecessors, null);
	}

	public void FindCostsToAll(int start, out TCost[] costs)
	{
		costs = new TCost[this.costs.Length];
		FindPaths(start, null, -1, null, out var _, null, costs);
	}

	public void FindCostsToAll(List<int> starts, out TCost[] costs)
	{
		costs = new TCost[this.costs.Length];
		FindPaths(-1, starts, -1, null, out var _, null, costs);
	}

	public bool TryFindPath(int start, int end, List<int> outPath)
	{
		FindPaths(start, null, end, outPath, out var foundEnd, null, null);
		return foundEnd;
	}

	public void FindPaths(int start, List<int> startList, int end, List<int> outPath, out bool foundEnd, int[] outPredecessors, TCost[] outCosts)
	{
		foundEnd = false;
		queue.Clear();
		Utils.FillArray(costs, maxCost);
		Utils.FillArray(predecessors, -1);
		if (startList != null)
		{
			start = startList[0];
			foreach (int start2 in startList)
			{
				queue.Enqueue(start2, minCost);
				costs[start2] = minCost;
			}
		}
		else
		{
			queue.Enqueue(start, minCost);
			costs[start] = minCost;
		}
		int num = -1;
		while (queue.Count > 0)
		{
			TCost currentCost;
			(num, currentCost) = queue.DequeueWithPriority();
			if (num == end)
			{
				break;
			}
			if (currentCost.CompareTo(costs[num]) > 0)
			{
				continue;
			}
			IEnumerator<int> neighbours = neighboursGetter.GetNeighbours(num);
			int num2 = predecessors[num];
			while (neighbours.MoveNext())
			{
				int current2 = neighbours.Current;
				if (current2 != num2)
				{
					TCost val = costCalculator.CostToNeighbour(currentCost, num, current2, end);
					if (val.CompareTo(costs[current2]) < 0)
					{
						costs[current2] = val;
						predecessors[current2] = num;
						queue.Enqueue(current2, val);
					}
				}
			}
			neighbours.Dispose();
		}
		if (outPath != null)
		{
			outPath.Clear();
			if (num == end)
			{
				foundEnd = true;
				TraceBackAndFlip(start, end, outPath);
			}
		}
		if (outPredecessors != null)
		{
			predecessors.CopyTo(outPredecessors, 0);
		}
		if (outCosts != null)
		{
			costs.CopyTo(outCosts, 0);
		}
	}

	private void TraceBackAndFlip(int start, int end, List<int> outPath)
	{
		for (int num = end; num != start; num = predecessors[num])
		{
			outPath.Add(num);
		}
		outPath.Add(start);
		int count = outPath.Count;
		for (int i = 0; i < count / 2; i++)
		{
			int value = outPath[i];
			outPath[i] = outPath[count - 1 - i];
			outPath[count - 1 - i] = value;
		}
	}
}
