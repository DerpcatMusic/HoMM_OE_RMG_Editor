using System.Collections.Generic;
using Hex.MapQuests;
using Hex.Session.Quests;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhOnProgressEvents : MonoBehaviour
	{
		[SerializeField]
		private TextMeshProUGUI label;

		[SerializeField]
		private List<BhOnProgressEventItemView> pool;

		private List<BhOnProgressEventItemView> buwc;

		private ConditionData buwd;

		private const string buwe = "On Progress Events";

		private const string buwf = "{0} [{1}]";

		public void Init(ConditionData _data)
		{
		}

		public void AddEvent()
		{
		}

		public void DeleteEvent(ProgressActionData _data, BhOnProgressEventItemView _item)
		{
		}

		public void Clear()
		{
		}

		private void nvv(ProgressActionData a)
		{
		}

		private void nvw()
		{
		}
	}
}
