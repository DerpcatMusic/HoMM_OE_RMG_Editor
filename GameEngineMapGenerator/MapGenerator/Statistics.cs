using System.Collections.Generic;
using System.Globalization;
using System.Text;
using UnityEngine;

namespace Hex.MapGenerator;

public class Statistics
{
	private class Variant
	{
		public ZoneStats[] zoneStats;

		public int count;
	}

	private class ContentListData
	{
		public string name;

		public HashSet<string> content;

		public ContentListData(string name, HashSet<string> content)
		{
			this.name = name;
			this.content = content;
		}
	}

	private class ZoneStats
	{
		public List<Stat> named = new List<Stat>();

		public List<Stat> contentListCounts = new List<Stat>();

		public List<Stat> specificObjectCounts = new List<Stat>();

		public List<Stat> all = new List<Stat>();

		public Dictionary<string, Stat> dict = new Dictionary<string, Stat>();

		public Stat this[string name]
		{
			get
			{
				if (!dict.TryGetValue(name, out var value))
				{
					value = new Stat(name);
					dict.Add(name, value);
					named.Add(value);
					all.Add(value);
				}
				return value;
			}
		}

		public void AddContentList()
		{
			Stat item = new Stat();
			contentListCounts.Add(item);
			all.Add(item);
		}

		public void AddSpecificObject()
		{
			Stat item = new Stat();
			specificObjectCounts.Add(item);
			all.Add(item);
		}
	}

	private class Stat
	{
		public string name;

		private float total;

		private float current;

		private float min = float.MaxValue;

		private float max = float.MinValue;

		public void Add(float val)
		{
			current += val;
		}

		public void Update()
		{
			total += current;
			min = Mathf.Min(min, current);
			max = Mathf.Max(max, current);
			current = 0f;
		}

		public (float avg, float min, float max) Report(int count)
		{
			return (avg: total / (float)count, min: min, max: max);
		}

		public Stat(string name)
		{
			this.name = name;
		}

		public Stat()
		{
		}
	}

	private static class StatNames
	{
		public const string TotalValue = "Total Value";

		public const string Area = "Area";

		public const string ValueMain = "Value Main";

		public const string ValueResources = "Value Resources";

		public const string PickupSlots = "Pickup Slots";

		public const string BuildingSlots1 = "Building Slots 1";

		public const string BuildingSlots2 = "Building Slots 2";

		public const string BuildingSlots3 = "Building Slots 3";
	}

	private const string separator = ", ";

	private StatisticsConfig statsConfig;

	private ContentDatabase contentDatabase;

	private RandomMapTemplate template;

	private TemplateContext templateData;

	private StringBuilder stringBuilder = new StringBuilder();

	private List<ContentListData> contentLists = new List<ContentListData>();

	private Dictionary<string, int> specificObjectIndices = new Dictionary<string, int>();

	private List<string> specificObjectNames = new List<string>();

	private Variant[] variants;

	public int VariantCount => variants.Length;

	public Statistics(RandomMapTemplate template)
	{
		GeneratorConfig config = Generator.GetConfig();
		statsConfig = config.GetStatsConfig();
		this.template = template;
		contentDatabase = config.GetContent();
		templateData = new TemplateContext(template, config);
		FindMentionedContentLists();
		CreateSpecificObjectsInfo();
		variants = new Variant[template.variants.Length];
		for (int i = 0; i < variants.Length; i++)
		{
			Variant variant = new Variant();
			variants[i] = variant;
			variant.zoneStats = new ZoneStats[this.template.variants[i].zones.Length];
			for (int j = 0; j < variant.zoneStats.Length; j++)
			{
				ZoneStats zoneStats = new ZoneStats();
				variant.zoneStats[j] = zoneStats;
				foreach (ContentListData contentList in contentLists)
				{
					_ = contentList;
					zoneStats.AddContentList();
				}
				foreach (string specificObjectName in specificObjectNames)
				{
					_ = specificObjectName;
					zoneStats.AddSpecificObject();
				}
			}
		}
	}

	public string SummaryCsv(int variant)
	{
		stringBuilder.Clear();
		Variant variant2 = variants[variant];
		for (int i = 0; i < variant2.zoneStats.Length; i++)
		{
			string name = template.variants[variant].zones[i].name;
			foreach (Stat item in variant2.zoneStats[i].named)
			{
				stringBuilder.Append(name);
				stringBuilder.Append(", ");
				stringBuilder.Append(item.name);
				stringBuilder.Append(", ");
				AppendStat(item, variant2.count);
				stringBuilder.Append("\n");
			}
		}
		return stringBuilder.ToString();
	}

	public string ContentListCsv(int variant)
	{
		stringBuilder.Clear();
		Variant variant2 = variants[variant];
		for (int i = 0; i < variant2.zoneStats.Length; i++)
		{
			string name = template.variants[variant].zones[i].name;
			for (int j = 0; j < contentLists.Count; j++)
			{
				stringBuilder.Append(name);
				stringBuilder.Append(", ");
				stringBuilder.Append(contentLists[j].name);
				stringBuilder.Append(", ");
				AppendStat(variant2.zoneStats[i].contentListCounts[j], variant2.count);
				stringBuilder.Append("\n");
			}
		}
		return stringBuilder.ToString();
	}

	public string SpecificObjectsCsv(int variant)
	{
		stringBuilder.Clear();
		Variant variant2 = variants[variant];
		for (int i = 0; i < variant2.zoneStats.Length; i++)
		{
			string name = template.variants[variant].zones[i].name;
			for (int j = 0; j < specificObjectNames.Count; j++)
			{
				stringBuilder.Append(name);
				stringBuilder.Append(", ");
				stringBuilder.Append(specificObjectNames[j]);
				stringBuilder.Append(", ");
				AppendStat(variant2.zoneStats[i].specificObjectCounts[j], variant2.count);
				stringBuilder.Append("\n");
			}
		}
		return stringBuilder.ToString();
	}

	public void AppendData(int variant, ContentPlacer.DebugInfo contentDebug)
	{
		variants[variant].count++;
		for (int i = 0; i < template.variants[variant].zones.Length; i++)
		{
			AppendZoneContent(variant, i, contentDebug);
		}
	}

	private void AppendStat(Stat stat, int count)
	{
		var (f, f2, f3) = stat.Report(count);
		stringBuilder.Append(FloatToStr(f));
		stringBuilder.Append(", ");
		stringBuilder.Append(FloatToStr(f2));
		stringBuilder.Append(", ");
		stringBuilder.Append(FloatToStr(f3));
	}

	private void AppendCategorySummary(ZoneStats stats, string category, ContentPlacer.DebugInfo.ContentCategorySummary summary)
	{
		stats[category + ": Value Mandatory"].Add(summary.valueMandatory);
		stats[category + ": Value Random"].Add(summary.valueRandom);
		stats[category + ": Value Resources"].Add(summary.valueResources);
		stats[category + ": Pickup Slots"].Add(summary.pickupSlotsCount);
		stats[category + ": Mandatory Pickups"].Add(summary.mandatoryPickupsCount);
		stats[category + ": Mandatory Buildings"].Add(summary.mandatoryBuildingsCount);
		for (int i = 0; i < summary.buildingSlotsCountBySize.Length; i++)
		{
			stats[$"{category}: Building Slots {i + 1}"].Add(summary.buildingSlotsCountBySize[i]);
		}
		for (int j = 0; j < summary.brackets.Length; j++)
		{
			Vector2Int bracket = summary.brackets[j];
			stats[category + ": Bracket " + BracketName(bracket) + " Target%"].Add(summary.targetPercentages[j]);
			stats[category + ": Bracket " + BracketName(bracket) + " Actual%"].Add(summary.actualPercentages[j]);
		}
	}

	private string BracketName(Vector2Int bracket)
	{
		string text = $"{bracket.x / 1000}k";
		string text2 = ((bracket.y > 0) ? $"{bracket.y / 1000}k" : "inf");
		return text + " - " + text2;
	}

	private void AppendZoneContent(int variant, int zoneIndex, ContentPlacer.DebugInfo info)
	{
		ContentPlacer.DebugInfo.ZoneContentSummary zoneContentSummary = info.contentSummaries[zoneIndex];
		ZoneStats zoneStats = variants[variant].zoneStats[zoneIndex];
		foreach (var content in zoneContentSummary.contentList)
		{
			Content item = content.Item2;
			if (!item.NeedsToPlaceMapObject)
			{
				continue;
			}
			string text = ((item.objectDesc.variant != -1) ? $"{item.objectDesc.Sid} {item.objectDesc.variant}" : item.objectDesc.Sid);
			for (int i = 0; i < zoneStats.contentListCounts.Count; i++)
			{
				if (contentLists[i].content.Contains(text))
				{
					zoneStats.contentListCounts[i].Add(1f);
				}
			}
			if (specificObjectIndices.TryGetValue(text, out var value))
			{
				zoneStats.specificObjectCounts[value].Add(1f);
			}
		}
		zoneStats["Total Value"].Add(zoneContentSummary.totalValue);
		AppendCategorySummary(zoneStats, "Guarded", zoneContentSummary.guarded);
		AppendCategorySummary(zoneStats, "Unguarded", zoneContentSummary.unguarded);
		foreach (Stat item2 in zoneStats.all)
		{
			item2.Update();
		}
	}

	private void CreateSpecificObjectsInfo()
	{
		List<MapObjectDesc> list = new List<MapObjectDesc>();
		List<float> list2 = new List<float>();
		int num = 0;
		string[] statSids = statsConfig.statSids;
		foreach (string text in statSids)
		{
			list.Clear();
			list2.Clear();
			contentDatabase.GetMapObjectDescAllVariants(list, list2, out var _, text);
			if (list.Count == 1 && list[0].variant == -1)
			{
				specificObjectIndices.Add(text, num);
				specificObjectNames.Add(text);
				num++;
				continue;
			}
			foreach (MapObjectDesc item in list)
			{
				if (item.mapConfig != null || item.metaObjectDesc != null)
				{
					string text2 = $"{item.Sid} {item.variant}";
					specificObjectIndices.Add(text2, num);
					specificObjectNames.Add(text2);
					num++;
				}
			}
		}
	}

	private void FindMentionedContentLists()
	{
		HashSet<string> namesSet = new HashSet<string>();
		HashSet<string> visitedPools = new HashSet<string>();
		for (int i = 0; i < template.variants.Length; i++)
		{
			RandomMapTemplate.Zone[] zones = template.variants[i].zones;
			foreach (RandomMapTemplate.Zone zone in zones)
			{
				string[] guardedContentPool = zone.guardedContentPool;
				foreach (string poolName in guardedContentPool)
				{
					GetFromPool(poolName);
				}
				guardedContentPool = zone.unguardedContentPool;
				foreach (string poolName2 in guardedContentPool)
				{
					GetFromPool(poolName2);
				}
				guardedContentPool = zone.resourcesContentPool;
				foreach (string poolName3 in guardedContentPool)
				{
					GetFromPool(poolName3);
				}
			}
		}
		RandomMapTemplate.MandatoryContentPreset[] mandatoryContent = template.mandatoryContent;
		for (int j = 0; j < mandatoryContent.Length; j++)
		{
			RandomMapTemplate.MandatoryContent[] content = mandatoryContent[j].content;
			for (int k = 0; k < content.Length; k++)
			{
				string[] guardedContentPool = content[k].includeLists;
				foreach (string item in guardedContentPool)
				{
					if (!namesSet.Contains(item))
					{
						namesSet.Add(item);
					}
				}
			}
		}
		List<string> list = new List<string>(namesSet);
		list.Sort();
		List<MapObjectDesc> list2 = new List<MapObjectDesc>();
		List<float> list3 = new List<float>();
		foreach (string item5 in list)
		{
			if (!templateData.ContentLists.TryGetById(item5, out var value))
			{
				continue;
			}
			HashSet<string> hashSet = new HashSet<string>();
			list2.Clear();
			list3.Clear();
			foreach (ContentWeight item6 in value.content)
			{
				if (item6.variant < 0)
				{
					contentDatabase.GetMapObjectDescAllVariants(list2, list3, out var _, item6.sid);
					foreach (MapObjectDesc item7 in list2)
					{
						if (item7.mapConfig != null || item7.metaObjectDesc != null)
						{
							string item2 = ((item7.variant >= 0) ? $"{item7.Sid} {item7.variant}" : item7.Sid);
							if (!hashSet.Contains(item2))
							{
								hashSet.Add(item2);
							}
						}
					}
				}
				else
				{
					string item3 = $"{item6.sid} {item6.variant}";
					if (!hashSet.Contains(item3))
					{
						hashSet.Add(item3);
					}
				}
			}
			contentLists.Add(new ContentListData(item5, hashSet));
		}
		void GetFromPool(string text)
		{
			if (visitedPools.Contains(text))
			{
				return;
			}
			visitedPools.Add(text);
			foreach (ContentPoolConfig.Group group in templateData.GetContentPool(text).config.groups)
			{
				string[] includeLists = group.includeLists;
				foreach (string item4 in includeLists)
				{
					if (!namesSet.Contains(item4))
					{
						namesSet.Add(item4);
					}
				}
			}
		}
	}

	private static string FloatToStr(float f)
	{
		return f.ToString(CultureInfo.InvariantCulture);
	}
}
