using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class GridNeighboursGetter : IPathfinderNeighboursGetter, IEnumerator<int>, IEnumerator, IDisposable
{
	private readonly Vector2Int size;

	private readonly Func<int, bool> isWalkable;

	private GridUtils.NeighboursIterator iterator;

	public int Current => iterator.Current;

	object IEnumerator.Current
	{
		get
		{
			throw new NotImplementedException();
		}
	}

	public GridNeighboursGetter(Vector2Int size, Func<int, bool> isWalkable)
	{
		this.size = size;
		this.isWalkable = isWalkable;
	}

	public IEnumerator<int> GetNeighbours(int index)
	{
		iterator = GridUtils.GetNeighboursAll(index, size);
		return this;
	}

	public bool MoveNext()
	{
		while (iterator.MoveNext())
		{
			if (isWalkable(iterator.Current))
			{
				return true;
			}
		}
		return false;
	}

	public void Reset()
	{
		iterator.Reset();
	}

	public void Dispose()
	{
	}
}
