using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class FloodFiller
{
	private struct FillFilter
	{
		public readonly IMapFilter mapFilter;

		public readonly bool addBorder;

		public readonly bool grabValueOnStart;

		public FillFilter(IMapFilter filter, bool addBorder, bool grabValueOnStart)
		{
			mapFilter = filter;
			this.addBorder = addBorder;
			this.grabValueOnStart = grabValueOnStart;
		}
	}

	private readonly Vector2Int size;

	private readonly bool[] visited;

	private readonly Queue<int> queue;

	private readonly List<FillFilter> filters;

	private List<int> outList;

	private bool[] outMask;

	private int currentFillArea;

	public Vector2Int Size => size;

	public FloodFiller(Vector2Int size)
	{
		this.size = size;
		visited = new bool[size.x * size.y];
		queue = new Queue<int>();
		filters = new List<FillFilter>();
	}

	public void FloodFill(int start, Neighbourhood neighbourhood, int maxArea = int.MaxValue)
	{
		foreach (FillFilter filter in filters)
		{
			if (filter.grabValueOnStart)
			{
				filter.mapFilter.GrabValue(start);
			}
			if (!filter.mapFilter.IsValid(start))
			{
				return;
			}
		}
		ResetIntermediates();
		visited[start] = true;
		queue.Enqueue(start);
		AddToResult(start);
		while (queue.Count > 0)
		{
			int index = queue.Dequeue();
			GridUtils.NeighboursIterator enumerator2 = GridUtils.GetNeighbours(neighbourhood, index, size).GetEnumerator();
			while (enumerator2.MoveNext())
			{
				int current2 = enumerator2.Current;
				if (visited[current2])
				{
					continue;
				}
				visited[current2] = true;
				bool flag = true;
				bool flag2 = true;
				foreach (FillFilter filter2 in filters)
				{
					bool flag3 = filter2.mapFilter.IsValid(current2);
					flag = flag && flag3;
					flag2 &= flag3 || filter2.addBorder;
				}
				if (flag)
				{
					queue.Enqueue(current2);
				}
				if (flag2)
				{
					AddToResult(current2);
					if (currentFillArea >= maxArea)
					{
						break;
					}
				}
			}
			if (currentFillArea >= maxArea)
			{
				break;
			}
		}
		DetachOutputs();
	}

	public (int[] map, int[][] tilesOfArea) FindAllContinuousAreas(Neighbourhood neighbourhood, int minimumArea = 0, int maxArea = int.MaxValue)
	{
		bool[] array = new bool[size.x * size.y];
		int[] array2 = new int[size.x * size.y];
		Utils.FillArray(array2, -1);
		List<int[]> list = new List<int[]>();
		List<int> list2 = new List<int>();
		int num = 0;
		for (int i = 0; i < array2.Length; i++)
		{
			if (array[i])
			{
				continue;
			}
			int num2 = array2[i];
			if (num2 != -1)
			{
				continue;
			}
			SetOutList(list2);
			FloodFill(i, neighbourhood, maxArea);
			if (list2.Count == 0)
			{
				continue;
			}
			for (int j = 0; j < list2.Count; j++)
			{
				array[list2[j]] = true;
			}
			if (list2.Count > 0 && list2.Count >= minimumArea)
			{
				num2 = num;
				num++;
				list.Add(list2.ToArray());
				for (int k = 0; k < list2.Count; k++)
				{
					array2[list2[k]] = num2;
				}
			}
			list2.Clear();
		}
		return (map: array2, tilesOfArea: list.ToArray());
	}

	public void AttachFilter(IMapFilter filter, bool addBorder = false, bool grabValueOnStart = false)
	{
		filters.Add(new FillFilter(filter, addBorder, grabValueOnStart));
	}

	public void SetOutList(List<int> outList)
	{
		this.outList = outList;
	}

	public void SetOutMask(bool[] outMask)
	{
		this.outMask = outMask;
	}

	public void DetachFilters()
	{
		filters.Clear();
	}

	public void DetachOutputs()
	{
		outList = null;
		outMask = null;
	}

	private void AddToResult(int index)
	{
		if (outList != null)
		{
			outList.Add(index);
		}
		if (outMask != null)
		{
			outMask[index] = true;
		}
		currentFillArea++;
	}

	private void ResetIntermediates()
	{
		queue.Clear();
		currentFillArea = 0;
		for (int i = 0; i < visited.Length; i++)
		{
			visited[i] = false;
		}
	}
}
