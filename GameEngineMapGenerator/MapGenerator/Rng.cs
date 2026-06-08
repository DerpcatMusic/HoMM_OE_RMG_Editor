using System;

namespace Hex.MapGenerator;

public class Rng
{
	private Random master;

	public Rng(int seed)
	{
		master = new Random(seed);
		int num = master.Next(16);
		for (int i = 0; i < num; i++)
		{
			seed = master.Next();
		}
		master = new Random(seed);
	}

	public Random Create()
	{
		return new Random(master.Next());
	}
}
