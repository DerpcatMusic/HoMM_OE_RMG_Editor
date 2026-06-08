using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class EncounterNeighboursGetter : IPathfinderNeighboursGetter, IEnumerator<int>, IEnumerator, IDisposable
{
	private EncounterTemplate template;

	private GridUtils.NeighboursIterator iterator;

	public int Current => iterator.Current;

	object IEnumerator.Current
	{
		get
		{
			throw new NotImplementedException();
		}
	}

	public void SetEncounter(EncounterTemplate template)
	{
		this.template = template;
	}

	public IEnumerator<int> GetNeighbours(int index)
	{
		iterator = GridUtils.GetNeighboursAll(index, new Vector2Int(template.width, template.height));
		return this;
	}

	public bool MoveNext()
	{
		while (iterator.MoveNext())
		{
			if (EncounterUtils.IsTileWalkable(template.tileContents[iterator.Current]))
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
