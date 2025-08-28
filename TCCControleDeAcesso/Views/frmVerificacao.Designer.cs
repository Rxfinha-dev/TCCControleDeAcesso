namespace TCCControleDeAcesso.Views
{
    partial class frmVerificacao
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.aluno = new System.Windows.Forms.Label();
            this.btnVerificar = new System.Windows.Forms.Button();
            this.progressBarVerificar = new System.Windows.Forms.ProgressBar();
            this.pictureBox1 = new System.Windows.Forms.PictureBox();
            this.lbl1 = new System.Windows.Forms.Label();
            this.lblCurso = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.lblRM = new System.Windows.Forms.Label();
            this.lblSerie = new System.Windows.Forms.Label();
            this.lblAno = new System.Windows.Forms.Label();
            this.lblNome = new System.Windows.Forms.Label();
            this.btnVoltar = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).BeginInit();
            this.SuspendLayout();
            // 
            // aluno
            // 
            this.aluno.AutoSize = true;
            this.aluno.Font = new System.Drawing.Font("Arial", 15.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.aluno.Location = new System.Drawing.Point(550, 389);
            this.aluno.Name = "aluno";
            this.aluno.Size = new System.Drawing.Size(43, 24);
            this.aluno.TabIndex = 0;
            this.aluno.Text = "N/A";
            // 
            // btnVerificar
            // 
            this.btnVerificar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVerificar.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnVerificar.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVerificar.Location = new System.Drawing.Point(496, 305);
            this.btnVerificar.Name = "btnVerificar";
            this.btnVerificar.Size = new System.Drawing.Size(150, 50);
            this.btnVerificar.TabIndex = 1;
            this.btnVerificar.Text = "VERIFICAR";
            this.btnVerificar.UseVisualStyleBackColor = false;
            this.btnVerificar.Click += new System.EventHandler(this.btnVerificar_Click);
            // 
            // progressBarVerificar
            // 
            this.progressBarVerificar.Location = new System.Drawing.Point(496, 361);
            this.progressBarVerificar.MarqueeAnimationSpeed = 0;
            this.progressBarVerificar.Name = "progressBarVerificar";
            this.progressBarVerificar.Size = new System.Drawing.Size(150, 25);
            this.progressBarVerificar.Step = 100;
            this.progressBarVerificar.TabIndex = 2;
            // 
            // pictureBox1
            // 
            this.pictureBox1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pictureBox1.Location = new System.Drawing.Point(1364, 447);
            this.pictureBox1.Name = "pictureBox1";
            this.pictureBox1.Size = new System.Drawing.Size(202, 273);
            this.pictureBox1.TabIndex = 3;
            this.pictureBox1.TabStop = false;
            // 
            // lbl1
            // 
            this.lbl1.AutoSize = true;
            this.lbl1.Font = new System.Drawing.Font("Arial", 14F);
            this.lbl1.Location = new System.Drawing.Point(904, 476);
            this.lbl1.Name = "lbl1";
            this.lbl1.Size = new System.Drawing.Size(66, 22);
            this.lbl1.TabIndex = 4;
            this.lbl1.Text = "Nome:";
            // 
            // lblCurso
            // 
            this.lblCurso.AutoSize = true;
            this.lblCurso.Font = new System.Drawing.Font("Arial", 14F);
            this.lblCurso.Location = new System.Drawing.Point(420, 269);
            this.lblCurso.Name = "lblCurso";
            this.lblCurso.Size = new System.Drawing.Size(66, 22);
            this.lblCurso.TabIndex = 5;
            this.lblCurso.Text = "Curso:";
            this.lblCurso.Click += new System.EventHandler(this.label1_Click);

            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Arial", 14F);
            this.label2.Location = new System.Drawing.Point(1149, 562);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(60, 22);
            this.label2.TabIndex = 6;
            this.label2.Text = "Série:";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Arial", 14F);
            this.label3.Location = new System.Drawing.Point(904, 666);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(44, 22);
            this.label3.TabIndex = 7;
            this.label3.Text = "RM:";
            // 
            // lblRM
            // 
            this.lblRM.AutoSize = true;
            this.lblRM.Font = new System.Drawing.Font("Arial", 14F);
            this.lblRM.Location = new System.Drawing.Point(917, 698);
            this.lblRM.Name = "lblRM";
            this.lblRM.Size = new System.Drawing.Size(0, 22);
            this.lblRM.TabIndex = 11;
            // 
            // lblSerie
            // 
            this.lblSerie.AutoSize = true;
            this.lblSerie.Font = new System.Drawing.Font("Arial", 14F);
            this.lblSerie.Location = new System.Drawing.Point(1162, 594);
            this.lblSerie.Name = "lblSerie";
            this.lblSerie.Size = new System.Drawing.Size(0, 22);
            this.lblSerie.TabIndex = 10;
            // 
            // lblAno
            // 
            this.lblAno.AutoSize = true;
            this.lblAno.Font = new System.Drawing.Font("Arial", 14F);
            this.lblAno.Location = new System.Drawing.Point(917, 594);
            this.lblAno.Name = "lblAno";
            this.lblAno.Size = new System.Drawing.Size(0, 22);
            this.lblAno.TabIndex = 9;
            // 
            // lblNome
            // 
            this.lblNome.AutoSize = true;
            this.lblNome.Font = new System.Drawing.Font("Arial", 14F);
            this.lblNome.Location = new System.Drawing.Point(917, 508);
            this.lblNome.Name = "lblNome";
            this.lblNome.Size = new System.Drawing.Size(0, 22);
            this.lblNome.TabIndex = 8;
            // 
            // btnVoltar
            // 
            this.btnVoltar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVoltar.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnVoltar.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVoltar.Location = new System.Drawing.Point(496, 754);
            this.btnVoltar.Name = "btnVoltar";
            this.btnVoltar.Size = new System.Drawing.Size(150, 50);
            this.btnVoltar.TabIndex = 12;
            this.btnVoltar.Text = "VOLTAR";
            this.btnVoltar.UseVisualStyleBackColor = false;
            this.btnVoltar.Click += new System.EventHandler(this.btnVoltar_Click);
            // 
            // frmVerificacao
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_sem_nome__7_;
            this.ClientSize = new System.Drawing.Size(1856, 933);
            this.Controls.Add(this.btnVoltar);
            this.Controls.Add(this.lblRM);
            this.Controls.Add(this.lblSerie);
            this.Controls.Add(this.lblAno);
            this.Controls.Add(this.lblNome);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.lblCurso);
            this.Controls.Add(this.lbl1);
            this.Controls.Add(this.pictureBox1);
            this.Controls.Add(this.progressBarVerificar);
            this.Controls.Add(this.btnVerificar);
            this.Controls.Add(this.aluno);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "frmVerificacao";
            this.Text = "frmVerificacao";
            this.Load += new System.EventHandler(this.frmVerificacao_Load);
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label aluno;
        private System.Windows.Forms.Button btnVerificar;
        private System.Windows.Forms.ProgressBar progressBarVerificar;
        private System.Windows.Forms.PictureBox pictureBox1;
        private System.Windows.Forms.Label lbl1;
        private System.Windows.Forms.Label lblCurso;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label lblRM;
        private System.Windows.Forms.Label lblSerie;
        private System.Windows.Forms.Label lblAno;
        private System.Windows.Forms.Label lblNome;
        private System.Windows.Forms.Button btnVoltar;
    }
}