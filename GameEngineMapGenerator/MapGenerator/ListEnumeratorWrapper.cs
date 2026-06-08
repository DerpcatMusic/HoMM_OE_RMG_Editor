using System;
using System.Collections;
using System.Collections.Generic;

namespace Hex.MapGenerator;

public class ListEnumeratorWrapper<T> : IEnumerator<T>, IEnumerator, IDisposable
{
	private List<T>.Enumerator enumerator;

	public T Current => enumerator.Current;

	object IEnumerator.Current => enumerator.Current;

	public void Set(List<T>.Enumerator enumerator)
	{
		this.enumerator = enumerator;
	}

	public void Dispose()
	{
		enumerator.Dispose();
	}

	public bool MoveNext()
	{
		return enumerator.MoveNext();
	}

	public void Reset()
	{
	}
}
