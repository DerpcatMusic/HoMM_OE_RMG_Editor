using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class Limits
{
	private class Entry
	{
		public int maxCount = int.MaxValue;

		public int[] variantMaxCount;

		public int currentCount;

		public int[] variantCurrentCount;
	}

	private class GroupEntry
	{
		public int maxCount = int.MaxValue;

		public int currentCount;

		public Dictionary<string, BitArray> content = new Dictionary<string, BitArray>();

		public bool IsContentMatch(string sid, int variant)
		{
			if (content.TryGetValue(sid, out var value))
			{
				if (value == null)
				{
					return true;
				}
				if (value[0] || value[variant + 1])
				{
					return true;
				}
			}
			return false;
		}
	}

	private Dictionary<string, Entry> bySid;

	private List<GroupEntry> groupEntries;

	public Limits(ContentDatabase contentDatabase, List<MapDescription.ContentCountLimit> limits, byte biomeID, int maxPrisonCount)
	{
		bySid = new Dictionary<string, Entry>(limits.Count);
		groupEntries = new List<GroupEntry>();
		if (limits == null)
		{
			return;
		}
		AddEntry(contentDatabase, "prison", -1, maxPrisonCount);
		foreach (MapDescription.ContentCountLimit limit in limits)
		{
			if (limit.biome != null)
			{
				int? biomeIdForSid = contentDatabase.GetBiomeIdForSid(limit.biome);
				if (!biomeIdForSid.HasValue || biomeID != biomeIdForSid.Value)
				{
					continue;
				}
			}
			if (limit.sid != null)
			{
				AddEntry(contentDatabase, limit.sid, limit.variant, limit.maxCount);
			}
			else
			{
				AddGroupEntry(contentDatabase, limit);
			}
		}
	}

	private Limits()
	{
		bySid = new Dictionary<string, Entry>();
		groupEntries = new List<GroupEntry>();
	}

	public Limits Clone()
	{
		Limits limits = new Limits();
		foreach (KeyValuePair<string, Entry> item in bySid)
		{
			string key = item.Key;
			Entry value = item.Value;
			Entry entry = new Entry();
			entry.maxCount = value.maxCount;
			entry.currentCount = value.currentCount;
			entry.variantMaxCount = value.variantMaxCount;
			entry.variantCurrentCount = value.variantCurrentCount.Clone() as int[];
			limits.bySid.Add(key, entry);
		}
		foreach (GroupEntry groupEntry2 in groupEntries)
		{
			GroupEntry groupEntry = new GroupEntry();
			groupEntry.maxCount = groupEntry2.maxCount;
			groupEntry.currentCount = groupEntry2.currentCount;
			groupEntry.content = groupEntry2.content;
			limits.groupEntries.Add(groupEntry);
		}
		return limits;
	}

	public void AddContent(MapObjectDesc desc)
	{
		if (bySid.TryGetValue(desc.Sid, out var value))
		{
			value.currentCount++;
			if (desc.variant >= 0)
			{
				value.variantCurrentCount[desc.variant]++;
			}
		}
		foreach (GroupEntry groupEntry in groupEntries)
		{
			if (groupEntry.IsContentMatch(desc.Sid, desc.variant))
			{
				groupEntry.currentCount++;
			}
		}
	}

	public bool IsLimitReached(MapObjectDesc desc)
	{
		if (bySid.TryGetValue(desc.Sid, out var value))
		{
			if (value.currentCount >= value.maxCount)
			{
				return true;
			}
			if (desc.variant >= 0 && value.variantCurrentCount[desc.variant] >= value.variantMaxCount[desc.variant])
			{
				return true;
			}
		}
		foreach (GroupEntry groupEntry in groupEntries)
		{
			if (groupEntry.IsContentMatch(desc.Sid, desc.variant) && groupEntry.currentCount >= groupEntry.maxCount)
			{
				return true;
			}
		}
		return false;
	}

	private void AddEntry(ContentDatabase contentDatabase, string sid, int variant, int maxCount)
	{
		if (!bySid.TryGetValue(sid, out var value))
		{
			value = new Entry();
			int variantCount = contentDatabase.GetVariantCount(sid);
			value.variantMaxCount = new int[variantCount];
			value.variantCurrentCount = new int[variantCount];
			for (int i = 0; i < variantCount; i++)
			{
				value.variantMaxCount[i] = int.MaxValue;
			}
			bySid[sid] = value;
		}
		if (variant < 0)
		{
			value.maxCount = Mathf.Min(value.maxCount, maxCount);
		}
		else
		{
			value.variantMaxCount[variant] = Mathf.Min(value.variantMaxCount[variant], maxCount);
		}
	}

	private void AddGroupEntry(ContentDatabase contentDatabase, MapDescription.ContentCountLimit limit)
	{
		GroupEntry groupEntry = new GroupEntry();
		foreach (ContentID item in limit.content)
		{
			AddContentToGroupEntry(contentDatabase, groupEntry, item.sid, item.variant);
		}
		groupEntry.maxCount = limit.maxCount;
		if (groupEntry.content.Count > 0)
		{
			groupEntries.Add(groupEntry);
		}
	}

	private void AddContentToGroupEntry(ContentDatabase contentDatabase, GroupEntry entry, string sid, int variant)
	{
		BitArray value = null;
		int variantCount = contentDatabase.GetVariantCount(sid);
		if (!entry.content.TryGetValue(sid, out value))
		{
			if (variantCount > 0)
			{
				value = new BitArray(variantCount);
			}
			entry.content[sid] = value;
		}
		if (variantCount > 0 && variant < variantCount)
		{
			value.Set(variant + 1, value: true);
		}
	}
}
