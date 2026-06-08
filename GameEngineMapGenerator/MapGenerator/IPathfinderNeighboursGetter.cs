using System.Collections.Generic;

namespace Hex.MapGenerator;

public interface IPathfinderNeighboursGetter
{
	IEnumerator<int> GetNeighbours(int index);
}
