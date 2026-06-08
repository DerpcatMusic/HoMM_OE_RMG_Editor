using System.Collections.Generic;

namespace Hex.MapGenerator;

public class GraphData
{
	public Graph graph;

	public List<int> vertexPositions;

	public GraphData(Graph graph, List<int> vertexPositions)
	{
		this.graph = graph;
		this.vertexPositions = vertexPositions;
	}
}
