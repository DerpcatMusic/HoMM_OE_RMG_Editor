using System;
using System.Collections.Generic;
using Hex.Configs;
using Hex.Session;

namespace Hex.MapGenerator;

public class ContentWeightsTable
{
	private class EntriesWithSid
	{
		public readonly string sid;

		public readonly int variantCount;

		public readonly int biomeCount;

		public PooledArray<ContentWeight> weights;

		public PooledArray<bool> bans;

		public EntriesWithSid(string sid, MemoryPool<ContentWeight> weightMem, MemoryPool<bool> boolMem, ContentDatabase database)
		{
			this.sid = sid;
			variantCount = database.GetVariantCount(sid);
			biomeCount = database.GetBiomesCount();
			weights = weightMem.Allocate((variantCount + 1) * (biomeCount + 1));
			bans = boolMem.Allocate(variantCount + 1, fillValue: false);
		}

		public void SetWeight(int variant, int biome, ContentWeight weight)
		{
			weights[WeightIndex(variant, biome)] = weight;
		}

		public ContentWeight GetWeight(int variant, int biome)
		{
			return weights[WeightIndex(variant, biome)];
		}

		public void Ban(int variant)
		{
			bans[BanIndex(variant)] = true;
		}

		public bool IsBanned(int variant)
		{
			return bans[BanIndex(variant)];
		}

		private int WeightIndex(int variant, int biome)
		{
			int num = ((biome >= 0) ? (biome + 1) : 0);
			int num2 = 0;
			if (variantCount != 0)
			{
				num2 = ((variant >= 0) ? (variant + 1) : 0);
			}
			return num2 + num * (variantCount + 1);
		}

		private int BanIndex(int variant)
		{
			if (variantCount == 0)
			{
				return 0;
			}
			return variant + 1;
		}
	}

	private ContentDatabase database;

	private BanInfo banInfo;

	private MemoryPool<float> weightsMemory = new MemoryPool<float>();

	private List<MapObjectDesc> descs = new List<MapObjectDesc>();

	private List<PooledArray<float>> weights = new List<PooledArray<float>>();

	private Dictionary<string, EntriesWithSid> sidGroups = new Dictionary<string, EntriesWithSid>();

	private MemoryPool<ContentWeight> tempWeightsMem = new MemoryPool<ContentWeight>();

	private MemoryPool<bool> tempBoolsMem = new MemoryPool<bool>();

	private List<MapObjectDesc> tempDescs = new List<MapObjectDesc>();

	private List<int> tempIndicies = new List<int>();

	private List<float> tempWeights = new List<float>();

	private float[] tempPerBiomeWeights;

	public List<MapObjectDesc> Descs => descs;

	public ContentWeightsTable(ContentDatabase database, BanInfo banInfo)
	{
		this.database = database;
		this.banInfo = banInfo;
		tempPerBiomeWeights = new float[database.GetBiomesCount()];
	}

	public void AddLists(List<List<ContentWeight>> contentLists, List<List<ContentID>> banLists, float totalWeight)
	{
		sidGroups.Clear();
		foreach (List<ContentWeight> contentList in contentLists)
		{
			foreach (ContentWeight item in contentList)
			{
				CombineEntriesBySid(sidGroups, tempWeightsMem, tempBoolsMem, item);
			}
		}
		foreach (List<ContentID> banList in banLists)
		{
			ApplyBans(sidGroups, banList);
		}
		List<MapObjectDesc> list = new List<MapObjectDesc>();
		List<PooledArray<float>> list2 = new List<PooledArray<float>>();
		foreach (EntriesWithSid value in sidGroups.Values)
		{
			ComputeWeights(list, list2, value);
		}
		int biomesCount = database.GetBiomesCount();
		float[] array = new float[biomesCount];
		for (int i = 0; i < list2.Count; i++)
		{
			PooledArray<float> pooledArray = list2[i];
			for (int j = 0; j < biomesCount; j++)
			{
				array[j] += pooledArray[j];
			}
		}
		for (int k = 0; k < biomesCount; k++)
		{
			if (array[k] > 0f)
			{
				array[k] = 1f / array[k];
			}
			else
			{
				array[k] = 1f;
			}
		}
		for (int l = 0; l < list2.Count; l++)
		{
			PooledArray<float> pooledArray2 = list2[l];
			for (int m = 0; m < biomesCount; m++)
			{
				pooledArray2[m] *= array[m] * totalWeight;
			}
			descs.Add(list[l]);
			weights.Add(list2[l]);
		}
	}

	public float GetWeight(int index, byte biome)
	{
		int biomeIndexById = database.GetBiomeIndexById(biome);
		return weights[index][biomeIndexById];
	}

	public void Clear()
	{
		weightsMemory.Clear();
		descs.Clear();
		weights.Clear();
	}

	public MapObjectDesc? Roll(byte biome, Limits limits, Random random)
	{
		tempWeights.Clear();
		tempIndicies.Clear();
		int biomeIndexById = database.GetBiomeIndexById(biome);
		for (int i = 0; i < weights.Count; i++)
		{
			float num = weights[i][biomeIndexById];
			if (num > 0f && !limits.IsLimitReached(descs[i]))
			{
				tempWeights.Add(num);
				tempIndicies.Add(i);
			}
		}
		if (tempWeights.Count == 0)
		{
			return null;
		}
		return descs[tempIndicies[RngUtils.WeightedIndex(tempWeights, random)]];
	}

	private void ComputeWeights(List<MapObjectDesc> descs, List<PooledArray<float>> weights, EntriesWithSid entries)
	{
		if (entries.IsBanned(-1))
		{
			return;
		}
		database.GetMapObjectDescAllVariants(tempDescs, tempWeights, out var variants, entries.sid);
		for (int i = 0; i < tempDescs.Count; i++)
		{
			MapObjectDesc item = tempDescs[i];
			if (item.mapConfig == null || entries.IsBanned(i) || (variants != null && !VariantValidationUtility.IsValid(variants[i], banInfo)))
			{
				continue;
			}
			int biomesCount = database.GetBiomesCount();
			bool flag = false;
			for (int j = 0; j < biomesCount; j++)
			{
				float num = 0f;
				ContentWeight weight = entries.GetWeight(i, j);
				if (weight != null)
				{
					num = weight.weight;
				}
				else
				{
					weight = entries.GetWeight(-1, j);
					if (weight != null)
					{
						num = weight.weight * tempWeights[i];
					}
					else
					{
						weight = entries.GetWeight(i, -1);
						if (weight != null)
						{
							num = weight.weight;
						}
						else
						{
							weight = entries.GetWeight(-1, -1);
							if (weight != null)
							{
								num = weight.weight * tempWeights[i];
							}
						}
					}
				}
				flag = flag || num > 0f;
				tempPerBiomeWeights[j] = num;
			}
			if (flag)
			{
				descs.Add(item);
				PooledArray<float> item2 = weightsMemory.Allocate(biomesCount, 0f);
				for (int k = 0; k < biomesCount; k++)
				{
					item2[k] = tempPerBiomeWeights[k];
				}
				weights.Add(item2);
			}
		}
	}

	private void CombineEntriesBySid(Dictionary<string, EntriesWithSid> dict, MemoryPool<ContentWeight> weightMem, MemoryPool<bool> boolMem, ContentWeight contentWeight)
	{
		if (!dict.TryGetValue(contentWeight.sid, out var value))
		{
			value = new EntriesWithSid(contentWeight.sid, weightMem, boolMem, database);
			dict[contentWeight.sid] = value;
		}
		int biome = -1;
		if (!string.IsNullOrEmpty(contentWeight.biome))
		{
			int? biomeIdForSid = database.GetBiomeIdForSid(contentWeight.biome);
			if (!biomeIdForSid.HasValue)
			{
				return;
			}
			biome = database.GetBiomeIndexById((byte)biomeIdForSid.Value);
		}
		if (contentWeight.variant < value.variantCount)
		{
			value.SetWeight(contentWeight.variant, biome, contentWeight);
		}
	}

	private void ApplyBans(Dictionary<string, EntriesWithSid> dict, List<ContentID> bans)
	{
		foreach (ContentID ban in bans)
		{
			if (dict.TryGetValue(ban.sid, out var value) && ban.variant < value.variantCount)
			{
				value.Ban(ban.variant);
			}
		}
	}
}
