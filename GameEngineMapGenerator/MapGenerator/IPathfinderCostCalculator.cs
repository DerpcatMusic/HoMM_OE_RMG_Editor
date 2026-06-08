namespace Hex.MapGenerator;

public interface IPathfinderCostCalculator<T>
{
	T MaxCost { get; }

	T MinCost { get; }

	T CostToNeighbour(T currentCost, int current, int neighbour, int target);
}
