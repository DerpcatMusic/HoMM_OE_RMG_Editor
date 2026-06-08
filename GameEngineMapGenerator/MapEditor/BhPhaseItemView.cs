using Hex.MapQuests;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhPhaseItemView : MonoBehaviour
	{
		[SerializeField]
		private TMP_InputField input;

		[SerializeField]
		private TextMeshProUGUI to;

		private PhaseData buwj;

		private BhQuestDataView buwk;

		private bool buwl;

		public int cmpf => 0;

		public void Init(PhaseData _data, BhQuestDataView _questDataView, bool _withSelection = false)
		{
		}

		public void OnOpen()
		{
		}

		public void OnUpdate()
		{
		}

		public void OnDelete()
		{
		}
	}
}
