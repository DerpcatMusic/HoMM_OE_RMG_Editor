using System.Collections.Generic;
using System.Runtime.CompilerServices;
using Hex.MapQuests;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhQuestDataView : MonoBehaviour
	{
		[SerializeField]
		private BhQuestContentsController contentsController;

		[SerializeField]
		private Toggle isFromStart;

		[SerializeField]
		private TMP_InputField inputField;

		[SerializeField]
		private BhPhaseItemView prefab;

		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private RectTransform button;

		[SerializeField]
		private BhQuestTopNavigationView navigation;

		private List<QuestData> buwx;

		private List<BhPhaseItemView> buwy;

		private List<BhPhaseItemView> buwz;

		private bool buxa;

		private const int buxb = 30;

		public QuestData buwv
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

		public QuestData buww
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

		private void Awake()
		{
		}

		public void Init(QuestData _questData)
		{
		}

		public void CreatePhase()
		{
		}

		public void nwp(PhaseData a, BhPhaseItemView b)
		{
		}

		public void UpdateData()
		{
		}

		public void nwq(PhaseData a)
		{
		}

		private void Clear()
		{
		}
	}
}
