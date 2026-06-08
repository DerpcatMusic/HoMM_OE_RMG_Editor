using System;
using System.Collections;
using System.Collections.Generic;

namespace Hex.MapGenerator;

public class GenericGraph : IPathfinderNeighboursGetter, IPathfinderCostCalculator<int>, IEnumerator<int>, IEnumerator, IDisposable
{
	private Action<List<int>, int> getNeighbours;

	private Func<int, int, int, int, int> getCost;

	private List<int> list = new List<int>();

	private List<int>.Enumerator enumerator;

	public int MaxCost => int.MaxValue;

	public int MinCost => 0;

	public int Current => enumerator.Current;

	object IEnumerator.Current => enumerator.Current;

	public GenericGraph(Action<List<int>, int> getNeighbours, Func<int, int, int, int, int> getCost)
	{
		this.getNeighbours = getNeighbours;
		this.getCost = getCost;
	}

	public IEnumerator<int> GetNeighbours(int index)
	{
		list.Clear();
		getNeighbours(list, index);
		enumerator = list.GetEnumerator();
		return this;
	}

	public int CostToNeighbour(int currentCost, int current, int neighbour, int target)
	{
		return getCost(currentCost, current, neighbour, target);
	}

	public bool MoveNext()
	{
		return enumerator.MoveNext();
	}

	public void Dispose()
	{
	}

	public void Reset()
	{
	}
}
