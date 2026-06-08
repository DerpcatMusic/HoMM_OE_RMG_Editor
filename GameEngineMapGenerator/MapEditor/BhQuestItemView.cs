using System.Runtime.CompilerServices;
using Hex.MapQuests;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhQuestItemView : MonoBehaviour
	{
		[SerializeField]
		private TMP_InputField inputField;

		[SerializeField]
		private TextMeshProUGUI label;

		private BhQuestListView buxd;

		private bool buxe;

		public QuestData buxc
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public string cmpg => null;

		public void Init(QuestData _quest, BhQuestListView _questListView, bool _withSelection = false)
		{
		}

		public void OnUpdate()
		{
		}

		public void OnOpen()
		{
		}

		public void OnDelete()
		{
		}
	}
}
