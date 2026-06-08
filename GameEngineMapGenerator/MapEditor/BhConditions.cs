using System.Collections.Generic;
using Hex.MapQuests;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhConditions : MonoBehaviour
	{
		[SerializeField]
		private TextMeshProUGUI label;

		[SerializeField]
		private List<BhConditionItem> pool;

		private List<BhConditionItem> buvg;

		private PhaseData buvh;

		private const string buvi = "Conditions";

		private const string buvj = "{0} [{1}]";

		public void Init(PhaseData _phaseData)
		{
		}

		public void AddCondition()
		{
		}

		public void DeleteCondition(ConditionData _data, BhConditionItem _item)
		{
		}

		private void nvo(ConditionData a)
		{
		}

		private void nvp()
		{
		}

		private void Clear()
		{
		}
	}
}
